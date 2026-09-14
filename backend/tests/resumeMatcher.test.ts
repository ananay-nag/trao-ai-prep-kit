import { matchResumeToKit } from '../src/pipeline/resumeMatcher.js';
import { LLMClient } from '../src/llm/client.js';
import { Kit } from '../src/types/kit.js';
import { ResumeMatchResultSchema } from '../src/types/resumeMatch.js';

describe('Resume-to-JD Matcher & Gap Analysis Pipeline', () => {
  const sampleKit: Kit = {
    source: {
      company: 'Acme Cloud',
      company_url: 'https://acme.io',
      role: 'Staff Infrastructure Engineer',
      location: 'Remote',
      jd_chars: 500,
      researched_at: new Date().toISOString(),
      pages_used: ['https://acme.io']
    },
    company_brief: {
      summary: 'Cloud infrastructure provider specializing in edge computing.',
      what_they_do: 'We build distributed edge proxies and low-latency storage.',
      sources: ['https://acme.io']
    },
    role: {
      title: 'Staff Infrastructure Engineer',
      seniority: 'Staff',
      responsibilities: ['Architect edge runtime', 'Optimize network throughput'],
      requirements: [
        { id: 'r1', text: 'Expert in Go or Rust distributed systems', kind: 'technical', priority: 'must' },
        { id: 'r2', text: 'Deep knowledge of Raft consensus and Paxos', kind: 'technical', priority: 'must' },
        { id: 'r3', text: 'Mentoring junior and senior engineers', kind: 'behavioural', priority: 'must' },
        { id: 'r4', text: 'Experience with eBPF networking', kind: 'domain', priority: 'nice' }
      ]
    },
    questions: [],
    flashcards: [],
    schedule: { days_available: 3, days: [] },
    coverage: { uncovered_requirement_ids: [], passes: 1 }
  };

  const sampleResume = `
    Jane Doe - Senior Distributed Systems Engineer
    Experience:
    - 6 years building distributed storage in Go at CloudCorp.
    - Led consensus migration for metadata engine using Raft protocol.
    - Mentored 4 engineers and ran weekly architecture reviews.
  `;

  test('Produces a schema-compliant match result with offline/mock fallback or LLM', async () => {
    const mockLlm = new LLMClient({ apiKey: 'mock-key' });
    const result = await matchResumeToKit(sampleResume, sampleKit, mockLlm);

    // Validate using Zod schema
    const parseRes = ResumeMatchResultSchema.safeParse(result);
    expect(parseRes.success).toBe(true);

    expect(result.match_score).toBeGreaterThanOrEqual(0);
    expect(result.match_score).toBeLessThanOrEqual(100);
    expect(typeof result.summary).toBe('string');
    expect(Array.isArray(result.matching_skills)).toBe(true);
    expect(Array.isArray(result.gaps)).toBe(true);
    expect(Array.isArray(result.vulnerabilities)).toBe(true);
    expect(Array.isArray(result.bridging_star_answers)).toBe(true);
  });

  test('Validates vulnerability items contain required fields', async () => {
    const mockLlm = new LLMClient({ apiKey: 'mock-key' });
    const result = await matchResumeToKit(sampleResume, sampleKit, mockLlm);

    if (result.vulnerabilities.length > 0) {
      const vuln = result.vulnerabilities[0];
      expect(vuln).toHaveProperty('area');
      expect(['high', 'medium', 'low']).toContain(vuln.risk_level);
      expect(vuln).toHaveProperty('reasoning');
      expect(vuln).toHaveProperty('predicted_question');
    }
  });

  test('Validates STAR bridging answers contain Situation, Task, Action, Result', async () => {
    const mockLlm = new LLMClient({ apiKey: 'mock-key' });
    const result = await matchResumeToKit(sampleResume, sampleKit, mockLlm);

    if (result.bridging_star_answers.length > 0) {
      const star = result.bridging_star_answers[0];
      expect(star).toHaveProperty('requirement_text');
      expect(star).toHaveProperty('situation');
      expect(star).toHaveProperty('task');
      expect(star).toHaveProperty('action');
      expect(star).toHaveProperty('result');
    }
  });
});
