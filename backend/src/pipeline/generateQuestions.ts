import { LLMClient } from '../llm/client.js';
import { getCategorizedQuestionsPrompt } from '../llm/prompts.js';
import { Question, QuestionCategory, Requirement } from '../types/kit.js';

const CATEGORIES: QuestionCategory[] = ['technical', 'behavioural', 'system-design', 'company-fit'];

/**
 * Generates categorized question bank with stable IDs and requirement linkage.
 */
export async function generateCategorizedQuestions(
  roleTitle: string,
  requirements: Requirement[],
  companySummary: string,
  llm: LLMClient
): Promise<Question[]> {
  const allQuestions: Question[] = [];
  let currentIdIndex = 1;
  const validReqIds = new Set(requirements.map((r) => r.id));

  for (const category of CATEGORIES) {
    try {
      const prompt = getCategorizedQuestionsPrompt(
        category,
        roleTitle,
        requirements,
        companySummary,
        currentIdIndex
      );

      const res = await llm.generateJson<{ questions: any[] }>(prompt, `Question Gen (${category})`, 0.7);
      const rawQuestions = Array.isArray(res.questions) ? res.questions : [];

      for (const q of rawQuestions) {
        // Filter requirement IDs to only existing ones
        const reqIds = (Array.isArray(q.requirement_ids) ? q.requirement_ids : [])
          .filter((id: string) => validReqIds.has(id));

        // Default to first requirement ID if none linked
        if (reqIds.length === 0 && requirements.length > 0) {
          reqIds.push(requirements[0].id);
        }

        const difficulty = Number(q.difficulty);
        const validDifficulty = [1, 2, 3].includes(difficulty) ? (difficulty as 1 | 2 | 3) : 2;

        allQuestions.push({
          id: `q${currentIdIndex++}`,
          requirement_ids: reqIds,
          category,
          prompt: String(q.prompt || `Explain your experience with ${category} aspects in this role.`).trim(),
          answer_outline: String(q.answer_outline || 'Provide concrete examples and trade-offs.').trim(),
          difficulty: validDifficulty
        });
      }
    } catch (err: any) {
      console.warn(`Warning: Failed generating questions for category ${category}: ${err.message}`);
    }
  }

  // Ensure at least 1 question exists
  if (allQuestions.length === 0 && requirements.length > 0) {
    allQuestions.push({
      id: 'q1',
      requirement_ids: [requirements[0].id],
      category: 'technical',
      prompt: `Can you walk us through your technical experience regarding ${requirements[0].text}?`,
      answer_outline: 'Highlight architecture, best practices, and lessons learned.',
      difficulty: 2
    });
  }

  return allQuestions;
}
