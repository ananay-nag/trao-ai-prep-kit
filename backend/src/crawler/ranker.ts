export interface ScoredLink {
  url: string;
  score: number;
  text: string;
  category: 'careers' | 'about' | 'engineering' | 'culture' | 'other';
}

const HIGH_PRIORITY_PATTERNS: Array<{ pattern: RegExp; score: number; category: ScoredLink['category'] }> = [
  { pattern: /(careers|jobs|join-us|work-with-us|hiring|openings|positions)/i, score: 50, category: 'careers' },
  { pattern: /(engineering|tech-blog|dev|developers|technology|architecture)/i, score: 40, category: 'engineering' },
  { pattern: /(about|about-us|company|story|mission|handbook|values|culture)/i, score: 35, category: 'about' },
  { pattern: /(interview|interview-process|how-we-hire|hiring-process)/i, score: 60, category: 'careers' }
];

const IGNORED_PATTERNS = [
  /\.(pdf|zip|tar|gz|png|jpg|jpeg|gif|svg|ico|css|js|mp4|mp3|avi)$/i,
  /#.*$/,
  /^(mailto|tel|javascript):/i,
  /(login|signin|signup|privacy|terms|cookie|cart|checkout|pricing)/i
];

/**
 * Ranks crawled links based on their relevance to company hiring, culture, tech stack, and about pages.
 */
export function rankDiscoveredLinks(links: Array<{ url: string; text: string }>, baseOrigin: string): ScoredLink[] {
  const scoredMap = new Map<string, ScoredLink>();

  for (const link of links) {
    const rawUrl = link.url.trim();
    if (!rawUrl || IGNORED_PATTERNS.some((p) => p.test(rawUrl))) {
      continue;
    }

    try {
      const parsed = new URL(rawUrl);
      // Keep only same origin or subdomains
      if (parsed.origin !== baseOrigin && !parsed.hostname.endsWith(`.${new URL(baseOrigin).hostname}`)) {
        continue;
      }

      const cleanUrl = `${parsed.origin}${parsed.pathname}`;
      if (cleanUrl === baseOrigin || cleanUrl === `${baseOrigin}/`) {
        continue; // homepage already fetched
      }

      let score = 0;
      let category: ScoredLink['category'] = 'other';

      for (const { pattern, score: pScore, category: pCat } of HIGH_PRIORITY_PATTERNS) {
        if (pattern.test(parsed.pathname) || pattern.test(link.text)) {
          score += pScore;
          category = pCat;
        }
      }

      if (score > 0 && !scoredMap.has(cleanUrl)) {
        scoredMap.set(cleanUrl, {
          url: cleanUrl,
          score,
          text: link.text.trim(),
          category
        });
      }
    } catch {
      continue;
    }
  }

  return Array.from(scoredMap.values()).sort((a, b) => b.score - a.score);
}
