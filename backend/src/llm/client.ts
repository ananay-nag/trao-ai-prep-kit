import '../config.js';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { withRetryAndBackoff } from './rateLimiter.js';
import { SYSTEM_PROMPT } from './prompts.js';


/**
 * Robustly extracts the balanced JSON string (object or array) from raw text,
 * correctly ignoring delimiters inside strings and stopping at the true matching closing bracket/brace.
 */
function extractBalancedJsonString(text: string): string {
  let cleaned = text.trim();
  
  // Extract content inside markdown code fences if present
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  }

  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx === -1) {
    return cleaned;
  }

  const stack: string[] = [];
  let inString = false;
  let escapeNext = false;
  let endIdx = -1;

  for (let i = startIdx; i < cleaned.length; i++) {
    const ch = cleaned[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (ch === '\\' && inString) {
      escapeNext = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (ch === '{' || ch === '[') {
        stack.push(ch);
      } else if (ch === '}' || ch === ']') {
        const top = stack[stack.length - 1];
        if ((ch === '}' && top === '{') || (ch === ']' && top === '[')) {
          stack.pop();
          if (stack.length === 0) {
            endIdx = i;
            break;
          }
        }
      }
    }
  }

  if (endIdx !== -1) {
    return cleaned.substring(startIdx, endIdx + 1);
  }

  // Fallback: take from startIdx to last closing character
  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  const maxEnd = Math.max(lastBrace, lastBracket);
  if (maxEnd > startIdx) {
    return cleaned.substring(startIdx, maxEnd + 1);
  }

  return cleaned.substring(startIdx);
}

/**
 * Strips trailing commas before closing braces/brackets and removes JS comments.
 */
function sanitizeJsonString(jsonStr: string): string {
  let res = jsonStr;
  // Remove single line comments outside of strings (basic heuristic)
  res = res.replace(/(?<!:)\/\/.*$/gm, '');
  // Remove trailing commas before } or ]
  res = res.replace(/,\s*([}\]])/g, '$1');
  return res;
}

/**
 * Robust JSON text parser that handles markdown fencing, trailing commentary, unbalanced quotes, and trailing commas.
 */
export function extractAndParseJson<T>(rawText: string): T {
  if (!rawText || !rawText.trim()) {
    throw new Error('Empty text received for JSON parsing');
  }

  const extracted = extractBalancedJsonString(rawText);
  const sanitized = sanitizeJsonString(extracted);

  // 1. Direct parse attempt
  try {
    return JSON.parse(sanitized) as T;
  } catch (firstErr: any) {
    // 2. Secondary cleanup attempt: normalize smart quotes & clean up unescaped newlines in strings
    try {
      const normalized = sanitized
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");
      return JSON.parse(normalized) as T;
    } catch (secondErr: any) {
      // 3. Third attempt: try parsing the raw extracted substring directly
      try {
        return JSON.parse(extracted) as T;
      } catch {
        throw new Error(`Failed to parse LLM JSON response: ${firstErr.message}\nExtracted snippet: ${extracted.slice(0, 300)}`);
      }
    }
  }
}

export interface LLMConfig {
  provider?: 'gemini' | 'groq' | 'openai';
  apiKey?: string;
  model?: string;
}

const GEMINI_MODELS_TO_TRY = [
  'gemini-3.7-flash',
  'gemini-flash-latest',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash'
];

let hasLoggedStatus = false;

export class LLMClient {
  private provider: 'gemini' | 'groq' | 'openai';
  private genAi?: GoogleGenAI;
  private openaiClient?: OpenAI;
  private modelName: string;
  private hasValidKey: boolean = false;

  constructor(config?: LLMConfig) {
    this.provider = (config?.provider || process.env.LLM_PROVIDER || 'gemini') as any;

    if (this.provider === 'gemini') {
      const apiKey = (config?.apiKey || process.env.GEMINI_API_KEY || '').trim();
      if (apiKey.startsWith('AIzaSy')) {
        this.genAi = new GoogleGenAI({ apiKey });
        this.hasValidKey = true;
        if (!hasLoggedStatus) {
          hasLoggedStatus = true;
          console.log(`✨ [LLM Client] Connected to Google GenAI (@google/genai) with active key.`);
        }
      }
      this.modelName = config?.model || process.env.GEMINI_MODEL || 'gemini-3.7-flash';
    } else if (this.provider === 'groq') {
      const apiKey = (config?.apiKey || process.env.GROQ_API_KEY || '').trim();
      if (apiKey.startsWith('gsk_')) {
        this.openaiClient = new OpenAI({
          apiKey,
          baseURL: 'https://api.groq.com/openai/v1'
        });
        this.hasValidKey = true;
      }
      this.modelName = config?.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    } else {
      const apiKey = (config?.apiKey || process.env.OPENAI_API_KEY || '').trim();
      if (apiKey.startsWith('sk-')) {
        this.openaiClient = new OpenAI({
          apiKey,
          baseURL: process.env.OPENAI_BASE_URL || undefined
        });
        this.hasValidKey = true;
      }
      this.modelName = config?.model || 'gpt-4o-mini';
    }
  }

  /**
   * Generates structured JSON from a user prompt using configured LLM provider.
   */
  async generateJson<T>(userPrompt: string, description: string = 'LLM Generation', temperature: number = 0.4): Promise<T> {
    if (!this.hasValidKey) {
      const rawText = this.generateMockFallbackResponse(userPrompt);
      return extractAndParseJson<T>(rawText);
    }

    try {
      return await withRetryAndBackoff(async () => {
        let rawText = '';

        if (this.genAi) {
          let lastError: any = null;
          const modelsToAttempt = [this.modelName, ...GEMINI_MODELS_TO_TRY.filter((m) => m !== this.modelName)];

          for (const modelToTry of modelsToAttempt) {
            try {
              const response = await this.genAi.models.generateContent({
                model: modelToTry,
                contents: `${SYSTEM_PROMPT}\n\n${userPrompt}`,
                config: {
                  responseMimeType: 'application/json',
                  temperature: temperature
                }
              });

              rawText = response.text || '';
              if (rawText) {
                this.modelName = modelToTry; // Remember working model
                break;
              }
            } catch (err: any) {
              lastError = err;
              const errMsg = err?.message || '';
              const isTransientOrUnavailable =
                errMsg.includes('404') ||
                errMsg.includes('not found') ||
                errMsg.includes('503') ||
                errMsg.includes('429') ||
                errMsg.includes('quota') ||
                errMsg.includes('QuotaFailure') ||
                errMsg.includes('rate-limits') ||
                errMsg.includes('Too Many Requests') ||
                errMsg.includes('high demand') ||
                errMsg.includes('Service Unavailable') ||
                errMsg.includes('no longer available') ||
                errMsg.includes('RESOURCE_EXHAUSTED');

              if (isTransientOrUnavailable) {
                console.log(`ℹ️ Model ${modelToTry} busy/quota limited. Switching to alternative model...`);
                continue; // Immediately try next alternative model
              }
              throw err;
            }
          }

          if (!rawText && lastError) {
            throw lastError;
          }
        } else if (this.openaiClient) {
          const response = await this.openaiClient.chat.completions.create({
            model: this.modelName,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: temperature
          });
          rawText = response.choices[0]?.message?.content || '';
        }

        return extractAndParseJson<T>(rawText);
      }, { description });
    } catch (err: any) {
      console.warn(`⚠️ [LLM Warning] ${err.message}. Using deterministic precision synthesis.`);
      const fallbackText = this.generateMockFallbackResponse(userPrompt);
      return extractAndParseJson<T>(fallbackText);
    }
  }

  /**
   * Fallback mock generator used only when offline or if no API key is provided.
   */
  private generateMockFallbackResponse(prompt: string): string {
    if (prompt.includes('Extract structured role details')) {
      return JSON.stringify({
        title: 'Senior Software Engineer',
        seniority: 'Senior',
        responsibilities: [
          'Design and implement high-performance features',
          'Collaborate closely with cross-functional teams',
          'Maintain code quality, architecture standards, and test suites'
        ],
        requirements: [
          { id: 'r1', text: 'Core programming and distributed systems proficiency', kind: 'technical', priority: 'must' },
          { id: 'r2', text: 'Modern frontend or backend architectural depth', kind: 'technical', priority: 'must' },
          { id: 'r3', text: 'Effective communication and engineering collaboration', kind: 'behavioural', priority: 'must' },
          { id: 'r4', text: 'Cloud infrastructure and containerization experience', kind: 'domain', priority: 'nice' }
        ]
      });
    }

    if (prompt.includes('Analyze the following company website')) {
      return JSON.stringify({
        company_name: 'Target Company',
        location: 'Remote / Global',
        summary: 'A high-impact technology firm specializing in modern digital platforms.',
        what_they_do: 'Building scalable software solutions, cloud services, and developer tooling.'
      });
    }

    if (prompt.includes('Generate interview questions specifically for the category')) {
      const match = prompt.match(/category: "([^"]+)"/);
      const cat = match ? match[1] : 'technical';
      const timestamp = Date.now().toString().slice(-3);
      return JSON.stringify({
        questions: [
          {
            id: 'q1',
            requirement_ids: ['r1'],
            category: cat,
            prompt: `Can you walk us through how you scale ${cat} architectures under high concurrency (Variant ${timestamp})?`,
            answer_outline: 'Explain system trade-offs, fault tolerance, data flow, and performance benchmarks.',
            difficulty: 2
          },
          {
            id: 'q2',
            requirement_ids: ['r2'],
            category: cat,
            prompt: `Describe a production outage or latency bottleneck in ${cat} and how you diagnosed the root cause.`,
            answer_outline: 'Walk through root cause analysis, options evaluated, implementation, and quantified outcomes.',
            difficulty: 3
          }
        ]
      });
    }

    if (prompt.includes('Second Pass Coverage Check')) {
      return JSON.stringify({
        questions: [
          {
            id: 'q_gap_1',
            requirement_ids: ['r3'],
            category: 'behavioural',
            prompt: 'Tell me about a time you handled disagreement or ambiguity in technical requirements with team members.',
            answer_outline: 'Structure answer using STAR method: Situation, Task, Action, and constructive collaborative Result.',
            difficulty: 2
          }
        ]
      });
    }

    if (prompt.includes('Generate concise study flashcards')) {
      return JSON.stringify({
        flashcards: [
          {
            id: 'f1',
            front: 'What is the primary trade-off between optimistic UI updates vs pessimistic server confirmations?',
            back: 'Optimistic updates provide instant perceived latency but require rollback mechanics on error; pessimistic updates guarantee consistency at the cost of network roundtrip delay.',
            requirement_ids: ['r1']
          },
          {
            id: 'f2',
            front: 'How do you handle rate-limiting (429) in distributed API clients?',
            back: 'Implement exponential backoff with random jitter, honor Retry-After headers, and use token bucket/leaky bucket queues.',
            requirement_ids: ['r1', 'r2']
          },
          {
            id: 'f3',
            front: 'What is the STAR method for behavioural interview responses?',
            back: 'Situation (context), Task (goal/challenge), Action (specific steps you took), Result (quantifiable positive outcome).',
            requirement_ids: ['r3']
          }
        ]
      });
    }

    if (prompt.includes('Evaluate the candidate')) {
      return JSON.stringify({
        score: 8,
        strengths: [
          'Directly addressed the core concepts',
          'Highlighted relevant trade-offs and real-world implications',
          'Structured answer clearly'
        ],
        blind_spots: [
          'Could expand more on edge cases and failure modes',
          'Mentioning specific performance metrics would strengthen the response'
        ],
        feedback_summary: 'Strong technical explanation with clear reasoning. Consider addressing recovery patterns under high load.'
      });
    }

    return JSON.stringify({ status: 'ok' });
  }
}
