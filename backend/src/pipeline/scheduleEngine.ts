import { Question, Requirement, Schedule, ScheduleDay } from '../types/kit.js';

/**
 * Pure deterministic arithmetic and allocation engine to generate the study schedule.
 * Handled in code, NOT by the LLM.
 */
export function allocateSchedule(
  daysAvailable: number,
  requirements: Requirement[],
  questions: Question[]
): Schedule {
  const safeDays = Math.max(1, Math.floor(daysAvailable));
  const mustHaveReqIds = new Set(requirements.filter((r) => r.priority === 'must').map((r) => r.id));

  // Sort questions by priority:
  // 1. Covers must-have requirement
  // 2. Difficulty descending (3 -> 2 -> 1) (harder earlier)
  // 3. Category priority: system-design -> technical -> behavioural -> company-fit
  const categoryWeight: Record<string, number> = {
    'system-design': 4,
    technical: 3,
    behavioural: 2,
    'company-fit': 1
  };

  const sortedQuestions = [...questions].sort((a, b) => {
    const aMust = a.requirement_ids.some((id) => mustHaveReqIds.has(id));
    const bMust = b.requirement_ids.some((id) => mustHaveReqIds.has(id));
    if (aMust !== bMust) return aMust ? -1 : 1;

    if (b.difficulty !== a.difficulty) return b.difficulty - a.difficulty;

    const aCat = categoryWeight[a.category] || 0;
    const bCat = categoryWeight[b.category] || 0;
    return bCat - aCat;
  });

  const days: ScheduleDay[] = [];
  const totalQuestions = sortedQuestions.length;

  if (safeDays === 1) {
    // 1-Day intensive cram schedule
    const allQIds = sortedQuestions.map((q) => q.id);
    const estMinutes = Math.min(180, Math.max(60, allQIds.length * 15));
    days.push({
      day: 1,
      focus: 'Intensive Full-Scope Prep & Core Must-Haves',
      question_ids: allQIds.length > 0 ? allQIds : ['q1'],
      minutes: estMinutes
    });
  } else {
    // Multi-day distribution
    const dayBuckets: string[][] = Array.from({ length: safeDays }, () => []);

    if (totalQuestions <= safeDays) {
      // More days than questions: distribute 1 per day, repeat high-diff questions on later review days
      for (let i = 0; i < totalQuestions; i++) {
        dayBuckets[i].push(sortedQuestions[i].id);
      }
      // Fill remaining days with targeted review from harder questions
      for (let d = totalQuestions; d < safeDays; d++) {
        const reviewQuestion = sortedQuestions[d % totalQuestions];
        if (reviewQuestion) {
          dayBuckets[d].push(reviewQuestion.id);
        } else if (sortedQuestions[0]) {
          dayBuckets[d].push(sortedQuestions[0].id);
        }
      }
    } else {
      // Standard distribution: distribute questions evenly across days
      for (let i = 0; i < totalQuestions; i++) {
        const targetDay = i % safeDays;
        dayBuckets[targetDay].push(sortedQuestions[i].id);
      }
    }

    // Ensure EVERY must-have requirement appears somewhere in the schedule
    const scheduledReqIds = new Set<string>();
    for (const bucket of dayBuckets) {
      for (const qId of bucket) {
        const q = questions.find((item) => item.id === qId);
        if (q) {
          for (const reqId of q.requirement_ids) {
            scheduledReqIds.add(reqId);
          }
        }
      }
    }

    for (const mustReqId of mustHaveReqIds) {
      if (!scheduledReqIds.has(mustReqId)) {
        const matchingQ = questions.find((q) => q.requirement_ids.includes(mustReqId));
        if (matchingQ && !dayBuckets[0].includes(matchingQ.id)) {
          dayBuckets[0].unshift(matchingQ.id);
          scheduledReqIds.add(mustReqId);
        }
      }
    }

    // Build day items
    for (let dayNum = 1; dayNum <= safeDays; dayNum++) {
      const qIds = dayBuckets[dayNum - 1];
      // Fallback if empty
      if (qIds.length === 0 && sortedQuestions.length > 0) {
        qIds.push(sortedQuestions[0].id);
      }

      // Generate context-aware focus title
      let focus = '';
      if (dayNum === 1) {
        focus = 'Architecture & Core Technical Deep-Dives';
      } else if (dayNum === safeDays) {
        focus = 'Behavioral Mock Practice & Final Review';
      } else if (dayNum === 2) {
        focus = 'Applied Problem Solving & System Design';
      } else {
        focus = `Day ${dayNum} Focus: Practice Drills & Competency Review`;
      }

      // Calculate realistic integer minutes (15 min per question + 15 min review, min 45m)
      const minutes = Math.max(45, qIds.length * 20);

      days.push({
        day: dayNum,
        focus,
        question_ids: qIds,
        minutes
      });
    }
  }

  return {
    days_available: safeDays,
    days
  };
}
