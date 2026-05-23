// ============================================================
// ScrapeIntel — URL Validator
// ============================================================

import { Logger } from "./logger";

/**
 * Validate that a string is a properly formatted URL.
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Normalize a URL string — add https:// if missing, trim whitespace.
 */
export function normalizeUrl(urlString: string): string {
  let url = urlString.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  // Remove trailing slash for consistency
  return url.replace(/\/+$/, "");
}

/**
 * Check if a URL is reachable by sending a HEAD request.
 * Falls back to GET if HEAD is not allowed.
 */
export async function isReachable(
  urlString: string,
  logger: Logger,
  timeoutMs: number = 10000
): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Try HEAD first (lighter)
    let response = await fetch(urlString, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      },
      redirect: "follow",
    });

    // Some servers block HEAD, try GET
    if (response.status === 405 || response.status === 403) {
      response = await fetch(urlString, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        },
        redirect: "follow",
      });
    }

    clearTimeout(timer);
    return response.ok || response.status === 301 || response.status === 302;
  } catch (err) {
    clearTimeout(timer);
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.warn(`URL unreachable: ${message}`, urlString);
    return false;
  }
}

/**
 * Validate and normalize a list of URLs. Returns valid URLs and logs issues.
 */
export async function validateUrls(
  urls: string[],
  logger: Logger
): Promise<string[]> {
  const validUrls: string[] = [];

  for (const rawUrl of urls) {
    const normalized = normalizeUrl(rawUrl);

    if (!isValidUrl(normalized)) {
      logger.error(`Invalid URL format: "${rawUrl}"`, rawUrl);
      continue;
    }

    logger.info(`Validating URL: ${normalized}`, normalized);
    const reachable = await isReachable(normalized, logger);

    if (reachable) {
      logger.success(`URL is reachable`, normalized);
      validUrls.push(normalized);
    } else {
      logger.warn(`URL is not reachable, will attempt scrape anyway`, normalized);
      // Still include it — the scraper will handle the error
      validUrls.push(normalized);
    }
  }

  return validUrls;
}
