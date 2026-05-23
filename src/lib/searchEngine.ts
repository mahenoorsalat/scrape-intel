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
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      return discoverUrlsViaGemini(query, geminiKey, logger);
    }
    return getMockSearchResults(query, logger);
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

/**
 * High-fidelity fallback search results when SERPER_API_KEY is not configured.
 */
function getMockSearchResults(query: string, logger: Logger): string[] {
  logger.warn(`SERPER_API_KEY not set — using local search fallback`, query);

  const q = query.toLowerCase();

  if (q.includes("pay") || q.includes("finance") || q.includes("fintech") || q.includes("checkout") || q.includes("money") || q.includes("stripe")) {
    return [
      "https://stripe.com",
      "https://paypal.com",
      "https://adyen.com",
      "https://checkout.com",
      "https://squareup.com"
    ];
  }

  if (q.includes("workspace") || q.includes("doc") || q.includes("collaboration") || q.includes("note") || q.includes("notion")) {
    return [
      "https://notion.so",
      "https://slack.com",
      "https://coda.io",
      "https://monday.com",
      "https://asana.com"
    ];
  }

  if (q.includes("frontend") || q.includes("cloud") || q.includes("host") || q.includes("deploy") || q.includes("vercel")) {
    return [
      "https://vercel.com",
      "https://netlify.com",
      "https://render.com",
      "https://cloudflare.com",
      "https://digitalocean.com"
    ];
  }

  if (q.includes("code") || q.includes("git") || q.includes("developer") || q.includes("software") || q.includes("github")) {
    return [
      "https://github.com",
      "https://gitlab.com",
      "https://bitbucket.org",
      "https://stackoverflow.com"
    ];
  }

  // General high-quality tech startups list
  return [
    "https://stripe.com",
    "https://notion.so",
    "https://vercel.com",
    "https://github.com",
    "https://linear.app"
  ];
}

/**
 * Dynamic URL discovery using Google Gemini AI as a knowledge source when Google Search API is missing.
 */
async function discoverUrlsViaGemini(
  query: string,
  apiKey: string,
  logger: Logger
): Promise<string[]> {
  logger.info(`SERPER_API_KEY missing — using Google Gemini AI to discover company URLs matching: "${query}"`);

  const prompt = `You are a professional business intelligence assistant. Discover and list 5 real, popular company website URLs that match the following user search query: "${query}".
Return ONLY a valid JSON array of strings containing the root URLs (e.g., ["https://stripe.com", "https://vercel.com"]). Do not wrap in markdown, do not write code blocks, no text explanation.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No response text");

    const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const urls = JSON.parse(jsonStr);

    if (Array.isArray(urls) && urls.every((u) => typeof u === "string")) {
      logger.success(`Gemini successfully discovered ${urls.length} matching company URLs!`);
      return urls;
    }
    throw new Error("Invalid response format");
  } catch (err) {
    logger.warn(`Gemini URL discovery failed: ${err instanceof Error ? err.message : "unknown error"} — falling back to local heuristic database`);
    return getMockSearchResults(query, logger);
  }
}
