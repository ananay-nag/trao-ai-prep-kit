import axios from 'axios';
import * as cheerio from 'cheerio';
import { validateAndNormalizeUrl } from './ssrf.js';
import { rankDiscoveredLinks } from './ranker.js';

export interface CrawledPage {
  url: string;
  title: string;
  text: string;
  statusCode: number;
}

export interface CrawlResult {
  pagesUsed: string[];
  pageContents: CrawledPage[];
  extractedTextSummary: string;
  error?: string;
}

const MAX_BYTES = 1024 * 1024; // 1MB limit
const TIMEOUT_MS = 6000;
const MAX_SUB_PAGES_TO_FETCH = 3;

/**
 * Clean text from HTML, removing scripts, styles, navbars, and excess whitespace.
 */
function cleanHtmlToText(html: string): { title: string; text: string; links: Array<{ url: string; text: string }> } {
  const $ = cheerio.load(html);

  const title = $('title').text().trim() || $('h1').first().text().trim() || '';

  // Collect links before removing elements
  const links: Array<{ url: string; text: string }> = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (href) {
      links.push({ url: href, text });
    }
  });

  // Remove non-content tags
  $('script, style, svg, noscript, iframe, footer, nav, header').remove();

  // Extract main text
  const text = $('body')
    .text()
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 10000); // Take first 10,000 chars for LLM context

  return { title, text, links };
}

/**
 * Fetches an individual page with safety checks, timeout, and size limits.
 */
export async function fetchCleanPage(targetUrl: string, baseUrl?: string): Promise<CrawledPage | null> {
  const normalized = validateAndNormalizeUrl(targetUrl, baseUrl);
  if (!normalized) return null;

  try {
    const response = await axios.get(normalized, {
      timeout: TIMEOUT_MS,
      maxContentLength: MAX_BYTES,
      headers: {
        'User-Agent': 'TraoPrepBot/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      validateStatus: (status) => status >= 200 && status < 400
    });

    const { title, text } = cleanHtmlToText(response.data);
    return {
      url: normalized,
      title,
      text,
      statusCode: response.status
    };
  } catch {
    return null;
  }
}

/**
 * Crawls a company site:
 * 1. Fetches homepage.
 * 2. Extracts and ranks internal links (careers, engineering, about).
 * 3. Fetches top candidate sub-pages.
 * 4. Aggregates clean text.
 */
export async function crawlCompanySite(companyUrl: string): Promise<CrawlResult> {
  const normalized = validateAndNormalizeUrl(companyUrl);
  if (!normalized) {
    return {
      pagesUsed: [],
      pageContents: [],
      extractedTextSummary: '',
      error: 'Invalid company URL provided'
    };
  }

  const pagesUsed: string[] = [];
  const pageContents: CrawledPage[] = [];

  try {
    const response = await axios.get(normalized, {
      timeout: TIMEOUT_MS,
      maxContentLength: MAX_BYTES,
      headers: {
        'User-Agent': 'TraoPrepBot/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      validateStatus: (status) => status >= 200 && status < 400
    });

    const baseOrigin = new URL(normalized).origin;
    const { title, text, links } = cleanHtmlToText(response.data);

    pagesUsed.push(normalized);
    pageContents.push({
      url: normalized,
      title,
      text,
      statusCode: response.status
    });

    // Score discovered links
    const scoredLinks = rankDiscoveredLinks(
      links.map((l) => ({
        url: validateAndNormalizeUrl(l.url, normalized) || '',
        text: l.text
      })),
      baseOrigin
    );

    // Fetch top ranked sub-pages
    const topLinks = scoredLinks.slice(0, MAX_SUB_PAGES_TO_FETCH);
    for (const link of topLinks) {
      const subPage = await fetchCleanPage(link.url);
      if (subPage && subPage.text.length > 50) {
        pagesUsed.push(subPage.url);
        pageContents.push(subPage);
      }
    }

    const aggregated = pageContents
      .map((p) => `--- PAGE: ${p.url} (${p.title}) ---\n${p.text}`)
      .join('\n\n');

    return {
      pagesUsed,
      pageContents,
      extractedTextSummary: aggregated
    };
  } catch (err: any) {
    return {
      pagesUsed: [],
      pageContents: [],
      extractedTextSummary: '',
      error: `Company site unreachable or 404: ${err.message || 'Fetch failed'}`
    };
  }
}
