import { LLMClient } from '../llm/client.js';
import { getTargetedGapQuestionsPrompt } from '../llm/prompts.js';
import { Coverage, Question, Requirement } from '../types/kit.js';

export interface CoverageResult {
  questions: Question[];
  coverage: Coverage;
}

/**
 * Pure deterministic code function to find uncovered must-have requirements.
 * Requirement is covered if at least one question references its ID in requirement_ids.
 */
export function findUncoveredMustHaves(requirements: Requirement[], questions: Question[]): Requirement[] {
  const coveredReqIds = new Set<string>();
  for (const q of questions) {
    for (const reqId of q.requirement_ids) {
      coveredReqIds.add(reqId);
    }
  }

  return requirements.filter(
    (req) => req.priority === 'must' && !coveredReqIds.has(req.id)
  );
}

/**
 * Executes deterministic coverage checking loop.
 * If gaps in must-have requirements exist after pass 1, runs targeted pass 2 to close them.
 */
export async function runCoveragePassLoop(
  requirements: Requirement[],
  initialQuestions: Question[],
  roleTitle: string,
  llm: LLMClient,
  maxPasses: number = 2
): Promise<CoverageResult> {
  let questions = [...initialQuestions];
  let passCount = 1;

  while (passCount < maxPasses) {
    const gaps = findUncoveredMustHaves(requirements, questions);

    if (gaps.length === 0) {
      // 100% must-have coverage achieved
      break;
    }

    passCount++;
    console.log(`🔄 [Coverage Pass ${passCount}] Detected ${gaps.length} uncovered must-have requirement(s): ${gaps.map((g) => g.id).join(', ')}. Generating targeted questions...`);

    try {
      const nextIdIndex = questions.length + 1;
      const prompt = getTargetedGapQuestionsPrompt(gaps, roleTitle, nextIdIndex);
      const res = await llm.generateJson<{ questions: any[] }>(prompt, `Coverage Pass ${passCount}`);
      const rawGapQuestions = Array.isArray(res.questions) ? res.questions : [];

      const newlyCoveredIds = new Set<string>();

      for (const q of rawGapQuestions) {
        const reqIds = (Array.isArray(q.requirement_ids) ? q.requirement_ids : [])
          .filter((id: string) => requirements.some((r) => r.id === id));

        const diff = Number(q.difficulty);
        const validDiff = [1, 2, 3].includes(diff) ? (diff as 1 | 2 | 3) : 2;

        const finalReqIds = reqIds.length > 0 ? reqIds : [gaps[0].id];
        finalReqIds.forEach((id: string) => newlyCoveredIds.add(id));

        questions.push({
          id: `q${questions.length + 1}`,
          requirement_ids: finalReqIds,
          category: ['technical', 'behavioural', 'system-design', 'company-fit'].includes(q.category)
            ? q.category
            : 'technical',
          prompt: String(q.prompt || `Deep dive into requirement: ${gaps[0].text}`).trim(),
          answer_outline: String(q.answer_outline || 'Thorough explanation of core principles.').trim(),
          difficulty: validDiff
        });
      }

      // Guarantee that ANY gap still missing after LLM response gets a targeted question generated
      const stillUncovered = gaps.filter((g) => !newlyCoveredIds.has(g.id));
      for (const gap of stillUncovered) {
        questions.push({
          id: `q${questions.length + 1}`,
          requirement_ids: [gap.id],
          category: gap.kind === 'behavioural' ? 'behavioural' : 'technical',
          prompt: `Can you discuss in detail your experience and practical problem-solving regarding "${gap.text}"?`,
          answer_outline: `Provide direct examples demonstrating proficiency with ${gap.text}, highlighting technical decisions and trade-offs.`,
          difficulty: 2
        });
      }
    } catch (err: any) {
      console.warn(`Warning: Gap closure pass failed: ${err.message}. Applying fallback question injection.`);
      for (const gap of gaps) {
        questions.push({
          id: `q${questions.length + 1}`,
          requirement_ids: [gap.id],
          category: gap.kind === 'behavioural' ? 'behavioural' : 'technical',
          prompt: `How have you applied "${gap.text}" in your previous roles?`,
          answer_outline: `Demonstrate proficiency in ${gap.text} with concrete scenarios.`,
          difficulty: 2
        });
      }
    }
  }

  // Final deterministic evaluation of remaining uncovered must-have requirement IDs
  const remainingGaps = findUncoveredMustHaves(requirements, questions).map((r) => r.id);

  return {
    questions,
    coverage: {
      uncovered_requirement_ids: remainingGaps,
      passes: passCount
    }
  };
}
