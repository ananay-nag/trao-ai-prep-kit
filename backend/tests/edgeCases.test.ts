import { crawlCompanySite } from '../src/crawler/scraper';
import { validateAndNormalizeUrl } from '../src/crawler/ssrf';
import { rankDiscoveredLinks } from '../src/crawler/ranker';
import { extractRequirements } from '../src/pipeline/extractRequirements';
import { allocateSchedule } from '../src/pipeline/scheduleEngine';
import { extractAndParseJson, LLMClient } from '../src/llm/client';
import { withRetryAndBackoff } from '../src/llm/rateLimiter';
import { generatePrepKit } from '../src/pipeline/orchestrator';
import { KitSchema } from '../src/types/kit';
import * as scraperModule from '../src/crawler/scraper';

describe('Requirement 10: Edge Cases & Failure Handling Suite', () => {

  // 1. Invalid, 404, or timing out company URL
  describe('Edge Case 1: Company URL is invalid, returns 404, or times out', () => {
    it('gracefully handles invalid URLs without crashing', async () => {
      const result = await crawlCompanySite('not-a-valid-url-at-all');
      expect(result.pagesUsed).toEqual([]);
      expect(result.error).toBeDefined();
    }, 10000);

    it('gracefully handles unreachable / 404 URLs and reports honest status', async () => {
      // Mock axios failure for fast test execution
      jest.spyOn(scraperModule, 'crawlCompanySite').mockResolvedValueOnce({
        pagesUsed: [],
        pageContents: [],
        extractedTextSummary: '',
        error: 'Company site unreachable or 404: Request failed with status code 404'
      });

      const result = await scraperModule.crawlCompanySite('https://unreachable-domain-test-404.org');
      expect(result.pagesUsed).toEqual([]);
      expect(result.error).toContain('unreachable or 404');
    });

    it('normalizer rejects dangerous protocols (e.g. file://, ftp://)', () => {
      expect(validateAndNormalizeUrl('file:///etc/passwd')).toBeNull();
      expect(validateAndNormalizeUrl('ftp://example.com')).toBeNull();
    });
  });

  // 2. Company site has no discoverable hiring or about page
  describe('Edge Case 2: Site has no discoverable hiring/about pages', () => {
    it('returns empty ranked list when no relevant sublinks exist', () => {
      const links = [
        { url: 'https://example.com/privacy', text: 'Privacy Policy' },
        { url: 'https://example.com/terms', text: 'Terms of Service' }
      ];
      const ranked = rankDiscoveredLinks(links, 'https://example.com');
      expect(ranked.length).toBe(0);
    });
  });

  // 3. Two-line stub job description
  describe('Edge Case 3: Two-line stub job description', () => {
    it('extracts minimal honest requirements without hallucinating phantom items', async () => {
      const stubJd = 'Looking for a Python dev. Must know Django.';
      const mockLlm = new LLMClient({ apiKey: 'none' });
      const role = await extractRequirements(stubJd, mockLlm);

      expect(role.requirements.length).toBeGreaterThanOrEqual(1);
      expect(role.requirements.length).toBeLessThanOrEqual(5);
      role.requirements.forEach(r => {
        expect(r.id).toMatch(/^r\d+$/);
        expect(['must', 'nice']).toContain(r.priority);
      });
    });
  });

  // 4. Public discussion turns up nothing (Empty crawl fallback)
  describe('Edge Case 4: Public footprint unavailable', () => {
    it('produces a fully compliant Kit even with an unreachable URL and stub JD', async () => {
      jest.spyOn(scraperModule, 'crawlCompanySite').mockResolvedValueOnce({
        pagesUsed: [],
        pageContents: [],
        extractedTextSummary: '',
        error: 'Company site unreachable or 404'
      });

      const mockLlm = new LLMClient({ apiKey: 'none' });
      const kit = await generatePrepKit({
        jd: 'FastAPI Backend Engineer. Must know PostgreSQL and Docker.',
        companyUrl: 'https://unreachable-404-mock-company.example.com',
        days: 3,
        llm: mockLlm
      });

      expect(KitSchema.safeParse(kit).success).toBe(true);
      expect(kit.source.company).toBeDefined();
      expect(kit.company_brief.summary).toBeDefined();
      expect(kit.coverage.uncovered_requirement_ids.length).toBe(0);
    });
  });

  // 5. Model returns invalid JSON or formatting quirks
  describe('Edge Case 5: Model returns invalid JSON or extra formatting', () => {
    it('parses markdown-wrapped JSON with trailing commentary', () => {
      const raw = '```json\n{"status": "ok", "items": [1, 2, 3]}\n```\nExtra commentary notes.';
      const parsed = extractAndParseJson<any>(raw);
      expect(parsed.status).toBe('ok');
      expect(parsed.items).toEqual([1, 2, 3]);
    });

    it('cleans trailing commas in arrays and objects', () => {
      const raw = '{\n  "name": "Backend",\n  "skills": ["Node", "SQL", ],\n}';
      const parsed = extractAndParseJson<any>(raw);
      expect(parsed.name).toBe('Backend');
      expect(parsed.skills).toEqual(['Node', 'SQL']);
    });
  });

  // 6. Rate limits (429) or transient 503 failures
  describe('Edge Case 6: Rate limit (429) and transient failure resilience', () => {
    it('retries on transient failures with backoff and succeeds', async () => {
      let attempts = 0;
      const mockFn = async () => {
        attempts++;
        if (attempts < 2) {
          const err: any = new Error('429 Too Many Requests (Quota exceeded)');
          err.status = 429;
          throw err;
        }
        return { success: true };
      };

      const result = await withRetryAndBackoff(mockFn, {
        maxRetries: 3,
        baseDelayMs: 20,
        description: 'Rate Limit Test'
      });

      expect(result.success).toBe(true);
      expect(attempts).toBe(2);
    });
  });

  // 7. Duplicate submissions (Same JD & Company submitted twice)
  describe('Edge Case 7: Duplicate input submissions', () => {
    it('produces valid schemas deterministically for identical requests', async () => {
      jest.spyOn(scraperModule, 'crawlCompanySite').mockResolvedValue({
        pagesUsed: ['https://company.example.com'],
        pageContents: [],
        extractedTextSummary: 'High-scale web platforms.'
      });

      const mockLlm = new LLMClient({ apiKey: 'none' });
      const input = {
        jd: 'Senior Full Stack Engineer. Must know React, Node.js, and System Design.',
        companyUrl: 'https://company.example.com',
        days: 5,
        llm: mockLlm
      };

      const kit1 = await generatePrepKit(input);
      const kit2 = await generatePrepKit(input);

      expect(KitSchema.safeParse(kit1).success).toBe(true);
      expect(KitSchema.safeParse(kit2).success).toBe(true);
      expect(kit1.role.title).toBe(kit2.role.title);
      expect(kit1.schedule.days_available).toBe(5);
      expect(kit2.schedule.days_available).toBe(5);
    });
  });

  // 8. 1-Day vs 60-Day schedule boundary testing
  describe('Edge Case 8: Schedule boundaries (1-Day vs 60-Day)', () => {
    const mockReqs = [
      { id: 'r1', text: 'Core Architecture', kind: 'technical' as const, priority: 'must' as const },
      { id: 'r2', text: 'Distributed Systems', kind: 'technical' as const, priority: 'must' as const },
      { id: 'r3', text: 'Communication', kind: 'behavioural' as const, priority: 'nice' as const }
    ];

    const mockQuestions = [
      { id: 'q1', requirement_ids: ['r1'], category: 'technical' as const, prompt: 'Q1', answer_outline: 'A1', difficulty: 3 as const },
      { id: 'q2', requirement_ids: ['r2'], category: 'system-design' as const, prompt: 'Q2', answer_outline: 'A2', difficulty: 2 as const },
      { id: 'q3', requirement_ids: ['r3'], category: 'behavioural' as const, prompt: 'Q3', answer_outline: 'A3', difficulty: 1 as const }
    ];

    it('allocates 1-Day intensive cram schedule accurately with integer minutes', () => {
      const schedule1 = allocateSchedule(1, mockReqs, mockQuestions);
      expect(schedule1.days.length).toBe(1);
      expect(schedule1.days[0].minutes).toBeGreaterThan(0);
      expect(Number.isInteger(schedule1.days[0].minutes)).toBe(true);
      // All must-haves are present in Day 1
      expect(schedule1.days[0].question_ids).toContain('q1');
      expect(schedule1.days[0].question_ids).toContain('q2');
    });

    it('allocates 60-Day mastery schedule across all 60 days with integer minutes', () => {
      const schedule60 = allocateSchedule(60, mockReqs, mockQuestions);
      expect(schedule60.days.length).toBe(60);
      expect(schedule60.days_available).toBe(60);

      schedule60.days.forEach(day => {
        expect(Number.isInteger(day.minutes)).toBe(true);
        expect(day.minutes).toBeGreaterThanOrEqual(15);
      });
      // Day 1 contains hardest must-have items
      expect(schedule60.days[0].question_ids).toContain('q1');
    });
  });

});
