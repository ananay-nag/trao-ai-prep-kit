import { allocateSchedule } from '../src/pipeline/scheduleEngine.js';
import { Question, Requirement } from '../src/types/kit.js';

describe('Deterministic Schedule Allocation Engine', () => {
  const sampleRequirements: Requirement[] = [
    { id: 'r1', text: '5+ years Node.js', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'React & TypeScript', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'Team Leadership', kind: 'behavioural', priority: 'must' },
    { id: 'r4', text: 'Docker & Kubernetes', kind: 'domain', priority: 'nice' }
  ];

  const sampleQuestions: Question[] = [
    {
      id: 'q1',
      requirement_ids: ['r1'],
      category: 'system-design',
      prompt: 'Design high-throughput stream processing',
      answer_outline: 'Explain buffering and backpressure',
      difficulty: 3
    },
    {
      id: 'q2',
      requirement_ids: ['r2'],
      category: 'technical',
      prompt: 'Explain React Concurrent Mode',
      answer_outline: 'Discuss fiber tree and reconciliation',
      difficulty: 2
    },
    {
      id: 'q3',
      requirement_ids: ['r3'],
      category: 'behavioural',
      prompt: 'Describe how you mentor junior engineers',
      answer_outline: 'Explain 1-on-1s and code review strategies',
      difficulty: 1
    }
  ];

  test('Produces exact number of days requested (e.g. 5 days)', () => {
    const schedule = allocateSchedule(5, sampleRequirements, sampleQuestions);
    expect(schedule.days_available).toBe(5);
    expect(schedule.days.length).toBe(5);
    expect(schedule.days.map((d) => d.day)).toEqual([1, 2, 3, 4, 5]);
  });

  test('Handles 1-day intensive schedule edge case', () => {
    const schedule = allocateSchedule(1, sampleRequirements, sampleQuestions);
    expect(schedule.days_available).toBe(1);
    expect(schedule.days.length).toBe(1);
    expect(schedule.days[0].day).toBe(1);
    expect(schedule.days[0].question_ids.length).toBeGreaterThan(0);
    expect(Number.isInteger(schedule.days[0].minutes)).toBe(true);
  });

  test('All durations are strictly integer minutes', () => {
    const schedule = allocateSchedule(3, sampleRequirements, sampleQuestions);
    for (const day of schedule.days) {
      expect(Number.isInteger(day.minutes)).toBe(true);
      expect(day.minutes).toBeGreaterThan(0);
    }
  });

  test('Every must-have requirement appears somewhere in the schedule', () => {
    const schedule = allocateSchedule(3, sampleRequirements, sampleQuestions);
    const scheduledQuestionIds = new Set(schedule.days.flatMap((d) => d.question_ids));

    const scheduledReqIds = new Set<string>();
    for (const qId of scheduledQuestionIds) {
      const q = sampleQuestions.find((item) => item.id === qId);
      if (q) {
        q.requirement_ids.forEach((r) => scheduledReqIds.add(r));
      }
    }

    const mustHaveReqIds = sampleRequirements.filter((r) => r.priority === 'must').map((r) => r.id);
    for (const reqId of mustHaveReqIds) {
      expect(scheduledReqIds.has(reqId)).toBe(true);
    }
  });

  test('Harder items (difficulty 3) are scheduled earlier in the timeline', () => {
    const schedule = allocateSchedule(3, sampleRequirements, sampleQuestions);
    // Day 1 should include difficulty 3 question q1
    expect(schedule.days[0].question_ids).toContain('q1');
  });
});
