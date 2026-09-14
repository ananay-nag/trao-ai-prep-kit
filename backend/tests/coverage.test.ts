import { findUncoveredMustHaves, runCoveragePassLoop } from '../src/pipeline/coverageEngine.js';
import { LLMClient } from '../src/llm/client.js';
import { Question, Requirement } from '../src/types/kit.js';

describe('Deterministic Coverage Engine', () => {
  const requirements: Requirement[] = [
    { id: 'r1', text: '5+ years React', kind: 'technical', priority: 'must' },
    { id: 'r2', text: '5+ years Node.js', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'Leadership', kind: 'behavioural', priority: 'must' },
    { id: 'r4', text: 'Docker knowledge', kind: 'domain', priority: 'nice' }
  ];

  test('Correctly identifies uncovered must-have requirements', () => {
    // Only r1 is covered
    const questions: Question[] = [
      {
        id: 'q1',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'React Question',
        answer_outline: 'Answer',
        difficulty: 2
      }
    ];

    const uncovered = findUncoveredMustHaves(requirements, questions);
    expect(uncovered.map((u) => u.id)).toEqual(['r2', 'r3']);
  });

  test('Executes second pass loop and achieves 100% must-have coverage', async () => {
    const offlineLlm = new LLMClient({ apiKey: 'mock-offline-key' }); // Offline mode for instant unit testing
    const initialQuestions: Question[] = [
      {
        id: 'q1',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'React state lifecycle',
        answer_outline: 'State details',
        difficulty: 2
      }
    ];

    const result = await runCoveragePassLoop(requirements, initialQuestions, 'Full Stack Lead', offlineLlm, 2);
    expect(result.coverage.passes).toBe(2);
    expect(result.questions.length).toBeGreaterThan(initialQuestions.length);

    const remainingUncovered = findUncoveredMustHaves(requirements, result.questions);
    expect(remainingUncovered.length).toBe(0);
    expect(result.coverage.uncovered_requirement_ids).toEqual([]);
  }, 15000);
});
