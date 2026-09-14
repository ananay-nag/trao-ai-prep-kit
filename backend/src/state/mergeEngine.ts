import { LLMClient } from '../llm/client.js';
import { generateCategorizedQuestions } from '../pipeline/generateQuestions.js';
import { generateFlashcards } from '../pipeline/generateFlashcards.js';
import { allocateSchedule } from '../pipeline/scheduleEngine.js';
import { crawlCompanySite } from '../crawler/scraper.js';
import { getCompanyBriefPrompt } from '../llm/prompts.js';
import { Kit, Question, QuestionCategory } from '../types/kit.js';
import { RegenerateSectionType } from '../types/state.js';

/**
 * State Merge Engine:
 * Preserves user modifications (edited questions, user-created questions, pinned items)
 * when a user requests regeneration of a specific section in the kit builder.
 */
export async function regenerateSectionWithStatePreservation(
  section: RegenerateSectionType,
  currentKit: Kit,
  llm: LLMClient = new LLMClient()
): Promise<Kit> {
  const updatedKit: Kit = JSON.parse(JSON.stringify(currentKit)); // Deep clone

  if (section === 'company_brief') {
    // Regenerate company brief only
    const crawlResult = await crawlCompanySite(currentKit.source.company_url);
    const briefPrompt = getCompanyBriefPrompt(
      currentKit.source.company_url,
      crawlResult.extractedTextSummary,
      currentKit.role.responsibilities.join('\n')
    );
    try {
      const briefData = await llm.generateJson<any>(briefPrompt, 'Regenerate Company Brief');
      updatedKit.company_brief = {
        summary: briefData.summary || currentKit.company_brief.summary,
        what_they_do: briefData.what_they_do || currentKit.company_brief.what_they_do,
        sources: crawlResult.pagesUsed.length > 0 ? crawlResult.pagesUsed : currentKit.company_brief.sources
      };
    } catch (err: any) {
      console.warn('Brief regeneration failed:', err.message);
    }
    return updatedKit;
  }

  if (section === 'schedule') {
    // Deterministically reallocate schedule based on current questions
    updatedKit.schedule = allocateSchedule(
      currentKit.schedule.days_available,
      currentKit.role.requirements,
      currentKit.questions
    );
    return updatedKit;
  }

  if (section === 'flashcards') {
    // Regenerate flashcards while keeping user-created cards
    const userCustomCards = currentKit.flashcards.filter(
      (f: any) => f._origin === 'user_created' || f._origin === 'user_edited'
    );
    const newCards = await generateFlashcards(
      currentKit.role.title,
      currentKit.role.requirements,
      currentKit.questions,
      llm
    );
    updatedKit.flashcards = [...userCustomCards, ...newCards];
    return updatedKit;
  }

  // Question category regeneration (technical | behavioural | system-design | company-fit)
  const targetCategory = section as QuestionCategory;

  // 1. Identify preserved questions: user-edited, user-created, or explicitly pinned
  const preservedQuestions = currentKit.questions.filter((q) => {
    if (q.category !== targetCategory) return true; // Keep all questions in other categories
    return q._isPinned === true || q._origin === 'user_edited' || q._origin === 'user_created';
  });

  // 2. Generate new fresh questions for this category
  const generatedForCategory = await generateCategorizedQuestions(
    currentKit.role.title,
    currentKit.role.requirements,
    currentKit.company_brief.summary,
    llm
  );
  const freshCategoryQuestions = generatedForCategory.filter((q) => q.category === targetCategory);

  // 3. Re-index and merge without clobbering
  const mergedQuestions: Question[] = [];
  let nextId = 1;

  for (const q of preservedQuestions) {
    mergedQuestions.push({
      ...q,
      id: `q${nextId++}`
    });
  }

  for (const q of freshCategoryQuestions) {
    mergedQuestions.push({
      ...q,
      id: `q${nextId++}`,
      _origin: 'generated'
    });
  }

  updatedKit.questions = mergedQuestions;

  // 4. Update deterministic schedule to reflect newly merged question IDs
  updatedKit.schedule = allocateSchedule(
    currentKit.schedule.days_available,
    currentKit.role.requirements,
    mergedQuestions
  );

  return updatedKit;
}
