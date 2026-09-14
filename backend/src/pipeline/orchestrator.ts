import { LLMClient } from '../llm/client.js';
import { getCompanyBriefPrompt } from '../llm/prompts.js';
import { crawlCompanySite } from '../crawler/scraper.js';
import { extractRequirements } from './extractRequirements.js';
import { generateCategorizedQuestions } from './generateQuestions.js';
import { generateFlashcards } from './generateFlashcards.js';
import { runCoveragePassLoop } from './coverageEngine.js';
import { allocateSchedule } from './scheduleEngine.js';
import { Kit, KitSchema } from '../types/kit.js';

export interface GenerateKitOptions {
  jd: string;
  companyUrl: string;
  days: number;
  onProgress?: (status: { step: string; percent: number; details?: string }) => void;
  llm?: LLMClient;
}

/**
 * Shared Master Pipeline:
 * Runs the full retrieval, generation, multi-pass coverage check, and schedule allocation.
 * Used by both the Web Application and the Batch CLI entry point.
 */
export async function generatePrepKit(options: GenerateKitOptions): Promise<Kit> {
  const { jd, companyUrl, days, onProgress } = options;
  const llm = options.llm || new LLMClient();

  const jdChars = jd.length;
  const researchedAt = new Date().toISOString();

  // Step 1: Intelligent Crawling & Discovery
  onProgress?.({ step: 'CRAWLING', percent: 15, details: 'Crawling company website and discovering hiring context...' });
  const crawlResult = await crawlCompanySite(companyUrl);

  // Step 2: Company Brief Synthesis
  onProgress?.({ step: 'BRIEF_GENERATION', percent: 30, details: 'Synthesizing company brief and tech culture...' });
  let companyBriefData = {
    company_name: 'Company',
    location: 'Remote / Unknown',
    summary: 'Company information extracted from job description.',
    what_they_do: 'Software development and business services.'
  };

  try {
    const briefPrompt = getCompanyBriefPrompt(companyUrl, crawlResult.extractedTextSummary, jd);
    companyBriefData = await llm.generateJson<any>(briefPrompt, 'Company Brief');
  } catch (err: any) {
    console.warn(`Warning: Company brief synthesis fallback used: ${err.message}`);
  }

  // Step 3: Requirement Extraction (Must vs Nice, Technical / Behavioural / Domain)
  onProgress?.({ step: 'REQUIREMENT_EXTRACTION', percent: 45, details: 'Extracting must-have and nice-to-have requirements...' });
  const role = await extractRequirements(jd, llm);

  // Step 4: Categorized Question Generation
  onProgress?.({ step: 'QUESTION_GENERATION', percent: 65, details: 'Generating categorized question banks...' });
  const initialQuestions = await generateCategorizedQuestions(
    role.title,
    role.requirements,
    companyBriefData.summary,
    llm
  );

  // Step 5: Deterministic Coverage Gap Check & Pass 2
  onProgress?.({ step: 'COVERAGE_CHECK', percent: 80, details: 'Executing deterministic coverage check and gap closure...' });
  const coverageResult = await runCoveragePassLoop(role.requirements, initialQuestions, role.title, llm, 2);

  // Step 6: Flashcard Generation
  onProgress?.({ step: 'FLASHCARD_GENERATION', percent: 90, details: 'Generating study flashcards...' });
  const flashcards = await generateFlashcards(role.title, role.requirements, coverageResult.questions, llm);

  // Step 7: Deterministic Arithmetic Schedule Allocation
  onProgress?.({ step: 'SCHEDULE_ALLOCATION', percent: 98, details: 'Allocating material across days deterministically...' });
  const schedule = allocateSchedule(days, role.requirements, coverageResult.questions);

  // Assemble full Kit
  const fullKit: Kit = {
    source: {
      company: companyBriefData.company_name || 'Target Company',
      company_url: companyUrl,
      role: role.title,
      location: companyBriefData.location || 'Remote',
      jd_chars: jdChars,
      researched_at: researchedAt,
      pages_used: crawlResult.pagesUsed.length > 0 ? crawlResult.pagesUsed : [companyUrl]
    },
    company_brief: {
      summary: companyBriefData.summary || 'Summary unavailable',
      what_they_do: companyBriefData.what_they_do || 'Business description unavailable',
      sources: crawlResult.pagesUsed.length > 0 ? crawlResult.pagesUsed : [companyUrl]
    },
    role,
    questions: coverageResult.questions,
    flashcards,
    schedule,
    coverage: coverageResult.coverage
  };

  onProgress?.({ step: 'COMPLETED', percent: 100, details: 'Prep kit generation complete!' });

  // Strictly validate against Appendix A schema
  return KitSchema.parse(fullKit);
}
