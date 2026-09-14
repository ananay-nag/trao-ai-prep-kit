import { KitSchema } from '../src/types/kit.js';
import { BatchInputSchema, BatchOutputSchema } from '../src/types/batch.js';

describe('Appendix A & B Strict Schema Validation', () => {
  test('Validates a complete Appendix A Kit schema', () => {
    const validKit = {
      source: {
        company: 'Trao Labs',
        company_url: 'https://trao.ai',
        role: 'Senior Platform Engineer',
        location: 'London, UK',
        jd_chars: 850,
        researched_at: new Date().toISOString(),
        pages_used: ['https://trao.ai', 'https://trao.ai/careers']
      },
      company_brief: {
        summary: 'Trao develops intelligent engineering evaluation systems.',
        what_they_do: 'Next-gen technical assessments and developer tooling.',
        sources: ['https://trao.ai/about']
      },
      role: {
        title: 'Senior Platform Engineer',
        seniority: 'Senior',
        responsibilities: ['Build distributed pipelines', 'Optimize cloud architecture'],
        requirements: [
          { id: 'r1', text: '5+ years Node.js', kind: 'technical', priority: 'must' },
          { id: 'r2', text: 'Cloud architecture', kind: 'technical', priority: 'must' }
        ]
      },
      questions: [
        {
          id: 'q1',
          requirement_ids: ['r1'],
          category: 'technical',
          prompt: 'How do you handle memory profiling in Node.js?',
          answer_outline: 'Discuss heap snapshots, V8 garbage collection, and clinic.js.',
          difficulty: 3
        }
      ],
      flashcards: [
        {
          id: 'f1',
          front: 'What is libuv?',
          back: 'A multi-platform C library providing asynchronous I/O and event loop support for Node.js.',
          requirement_ids: ['r1']
        }
      ],
      schedule: {
        days_available: 3,
        days: [
          {
            day: 1,
            focus: 'Core Platform Architecture',
            question_ids: ['q1'],
            minutes: 60
          }
        ]
      },
      coverage: {
        uncovered_requirement_ids: [],
        passes: 2
      }
    };

    const parsed = KitSchema.safeParse(validKit);
    expect(parsed.success).toBe(true);
  });

  test('Validates Appendix B Batch Input & Output', () => {
    const sampleInput = [
      {
        id: 'case-01',
        jd: 'Engineer JD text here...',
        company_url: 'https://example.com',
        days: 5
      }
    ];
    expect(BatchInputSchema.safeParse(sampleInput).success).toBe(true);

    const sampleOutput = {
      version: '1.0',
      generated_at: new Date().toISOString(),
      kits: [
        {
          id: 'case-01',
          status: 'ok',
          kit: null, // nullable for test
          error: null
        },
        {
          id: 'case-02',
          status: 'failed',
          kit: null,
          error: {
            code: 'COMPANY_UNREACHABLE',
            message: 'Company site unreachable after 3 retries.'
          }
        }
      ]
    };
    expect(BatchOutputSchema.safeParse(sampleOutput).success).toBe(true);
  });
});
