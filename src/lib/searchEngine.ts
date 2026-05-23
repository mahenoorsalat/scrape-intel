// ============================================================
// ScrapeIntel — Search Engine (Serper.dev Integration)
// ============================================================

import { Logger } from "./logger";

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

interface SerperResponse {
  organic: SerperResult[];
  searchParameters: {
    q: string;
  };
}

/**
 * Domains to exclude from search results (not company websites).
 */
const EXCLUDED_DOMAINS = new Set([
  "wikipedia.org",
  "youtube.com",
  "reddit.com",
  "twitter.com",
  "x.com",
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "tiktok.com",
  "pinterest.com",
  "amazon.com",
  "yelp.com",
  "glassdoor.com",
  "indeed.com",
  "crunchbase.com",
  "bloomberg.com",
  "reuters.com",
  "forbes.com",
  "techcrunch.com",
  "medium.com",
  "quora.com",
  "stackoverflow.com",
  "github.com",
]);

/**
 * Check if a URL belongs to an excluded domain.
 */
function isExcludedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return EXCLUDED_DOMAINS.has(hostname);
  } catch {
    return false;
  }
}

/**
 * Search for companies using Serper.dev (Google Search API).
 * Returns a list of company website URLs.
 */
export async function searchCompanies(
  query: string,
  logger: Logger,
  maxResults: number = 10
): Promise<string[]> {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    logger.error("SERPER_API_KEY not set — cannot perform search");
    throw new Error(
      "Search functionality requires SERPER_API_KEY. Please add it to your .env.local file."
    );
  }

  logger.info(`Searching Google for: "${query}"`);

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        q: query,
        num: Math.min(maxResults * 2, 20), // Fetch extra to filter
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Serper API error: ${response.status} — ${errorText}`);
    }

    const data: SerperResponse = await response.json();

    if (!data.organic || data.organic.length === 0) {
      logger.warn("No search results found for query");
      return [];
    }

    // Filter out non-company domains and deduplicate by root domain
    const seenDomains = new Set<string>();
    const companyUrls: string[] = [];

    for (const result of data.organic) {
      if (isExcludedDomain(result.link)) {
        logger.info(`Skipping non-company result: ${result.link}`);
        continue;
      }

      try {
        const hostname = new URL(result.link).hostname.replace("www.", "");
        if (seenDomains.has(hostname)) continue;
        seenDomains.add(hostname);

        // Prefer the root URL over deep links
        const rootUrl = `https://${hostname}`;
        companyUrls.push(rootUrl);

        logger.success(`Found company: ${result.title} → ${rootUrl}`);

        if (companyUrls.length >= maxResults) break;
      } catch {
        continue;
      }
    }

    logger.info(`Discovered ${companyUrls.length} company URLs from search`);
    return companyUrls;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown search error";
    logger.error(`Search failed: ${message}`);
    throw new Error(`Search failed: ${message}`);
  }
}
