// ============================================================
// ScrapeIntel — Core Scraper Engine
// ============================================================

import * as cheerio from "cheerio";
import { Logger } from "./logger";

export interface ScrapeResult {
  url: string;
  html: string;
  $: cheerio.CheerioAPI;
  statusCode: number;
  contentType: string;
  redirectedUrl?: string;
}

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
];

/**
 * Pick a random User-Agent to rotate identities.
 */
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Fetch and parse a webpage's HTML.
 */
export async function scrapeUrl(
  url: string,
  logger: Logger,
  timeoutMs: number = 15000
): Promise<ScrapeResult> {
  logger.info(`Fetching page...`, url);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": getRandomUserAgent(),
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      redirect: "follow",
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      logger.warn(`Non-HTML content type: ${contentType}`, url);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    logger.success(`Page fetched successfully (${(html.length / 1024).toFixed(1)}KB)`, url);

    return {
      url,
      html,
      $,
      statusCode: response.status,
      contentType,
      redirectedUrl: response.url !== url ? response.url : undefined,
    };
  } catch (err) {
    clearTimeout(timer);
    const message = err instanceof Error ? err.message : "Unknown fetch error";

    if (message.includes("abort")) {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }

    throw new Error(`Failed to fetch: ${message}`);
  }
}
