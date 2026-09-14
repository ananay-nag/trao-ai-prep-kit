import { LLMClient } from '../llm/client.js';
import { getFlashcardsPrompt } from '../llm/prompts.js';
import { Flashcard, Question, Requirement } from '../types/kit.js';

/**
 * Generates study flashcards mapped to requirement IDs.
 */
export async function generateFlashcards(
  roleTitle: string,
  requirements: Requirement[],
  questions: Question[],
  llm: LLMClient
): Promise<Flashcard[]> {
  const validReqIds = new Set(requirements.map((r) => r.id));
  const questionsSummary = questions.map((q) => `[${q.id}] ${q.prompt}`).join('\n');

  try {
    const prompt = getFlashcardsPrompt(roleTitle, requirements, questionsSummary);
    const res = await llm.generateJson<{ flashcards: any[] }>(prompt, 'Flashcard Generation');
    const rawFlashcards = Array.isArray(res.flashcards) ? res.flashcards : [];

    let currentId = 1;
    const flashcards: Flashcard[] = rawFlashcards.map((f) => {
      const reqIds = (Array.isArray(f.requirement_ids) ? f.requirement_ids : [])
        .filter((id: string) => validReqIds.has(id));

      if (reqIds.length === 0 && requirements.length > 0) {
        reqIds.push(requirements[0].id);
      }

      return {
        id: `f${currentId++}`,
        front: String(f.front || 'Key Concept Review').trim(),
        back: String(f.back || 'Key Technical Summary').trim(),
        requirement_ids: reqIds
      };
    });

    if (flashcards.length > 0) {
      return flashcards;
    }
  } catch (err: any) {
    console.warn(`Warning: Flashcard generation failed: ${err.message}`);
  }

  // Fallback generation from requirements
  return requirements.slice(0, 5).map((r, i) => ({
    id: `f${i + 1}`,
    front: `What are the key best practices for: ${r.text}?`,
    back: `Understand fundamental architectural patterns, edge cases, and performance implications of ${r.text}.`,
    requirement_ids: [r.id]
  }));
}
