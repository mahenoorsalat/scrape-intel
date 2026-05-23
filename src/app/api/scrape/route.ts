// ============================================================
// ScrapeIntel — Scrape API Route
// POST /api/scrape — Scrape company data from URLs
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { scrapeUrl } from "@/lib/scraper";
import { extractBasicData, extractMediumData } from "@/lib/extractor";
import { detectTechStack } from "@/lib/techDetector";
import { enrichWithAI } from "@/lib/aiEnricher";
import { validateUrls } from "@/lib/validator";
import { RateLimiter } from "@/lib/rateLimiter";
import { Logger } from "@/lib/logger";
import { CompanyData, ExtractionLevel, ScrapeResponse } from "@/lib/types";

export const maxDuration = 60; // Allow up to 60 seconds for scraping

export async function POST(request: NextRequest) {
  const logger = new Logger();
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { urls, extractionLevel = 1 } = body as {
      urls: string[];
      extractionLevel: ExtractionLevel;
    };

    // Validate input
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "At least one URL is required", logs: logger.getLogs() },
        { status: 400 }
      );
    }

    if (urls.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 URLs allowed per request", logs: logger.getLogs() },
        { status: 400 }
      );
    }

    if (![1, 2, 3].includes(extractionLevel)) {
      return NextResponse.json(
        { error: "Extraction level must be 1, 2, or 3", logs: logger.getLogs() },
        { status: 400 }
      );
    }

    logger.info(
      `Starting scrape job: ${urls.length} URL(s), Level ${extractionLevel}`
    );

    // Validate URLs
    const validUrls = await validateUrls(urls, logger);
    logger.info(`${validUrls.length} valid URLs to process`);

    // Rate limiter: 1.5s between requests
    const rateLimiter = new RateLimiter(1500);
    const results: CompanyData[] = [];

    for (let i = 0; i < validUrls.length; i++) {
      const url = validUrls[i];
      const companyId = `company-${i + 1}-${Date.now()}`;

      logger.info(`[${i + 1}/${validUrls.length}] Processing: ${url}`);

      try {
        // Rate limiting
        if (i > 0) {
          await rateLimiter.waitWithJitter();
        }

        // Fetch & parse HTML
        const scrapeResult = await scrapeUrl(url, logger);

        // Level 1: Basic extraction
        const basicData = extractBasicData(
          scrapeResult.html,
          scrapeResult.$,
          scrapeResult.redirectedUrl || url
        );

        const companyData: CompanyData = {
          id: companyId,
          scrapedAt: new Date().toISOString(),
          sourceUrl: url,
          status: "success",
          basic: basicData,
        };

        // Level 2: Medium extraction
        if (extractionLevel >= 2) {
          logger.info("Extracting enhanced details...", url);
          companyData.medium = extractMediumData(scrapeResult.$);
        }

        // Level 3: Advanced extraction
        if (extractionLevel >= 3) {
          logger.info("Detecting tech stack...", url);
          const techStack = detectTechStack(scrapeResult.html, scrapeResult.$);

          companyData.advanced = {
            techStack,
          };

          // AI enrichment
          const aiResult = await enrichWithAI(
            scrapeResult.html,
            basicData.companyName,
            url,
            logger
          );

          if (aiResult) {
            // Merge AI results into medium data
            if (companyData.medium) {
              companyData.medium.industry =
                companyData.medium.industry || aiResult.medium.industry;
              companyData.medium.yearFounded =
                companyData.medium.yearFounded || aiResult.medium.yearFounded;
              companyData.medium.productsServices =
                companyData.medium.productsServices ||
                aiResult.medium.productsServices;
            }

            // Merge AI results into advanced data
            companyData.advanced = {
              ...companyData.advanced,
              ...aiResult.advanced,
            };
          }
        }

        // Check if we got partial data
        if (
          basicData.emails.length === 0 &&
          basicData.phoneNumbers.length === 0
        ) {
          companyData.status = "partial";
          logger.warn("Limited contact info extracted", url);
        }

        results.push(companyData);
        logger.success(
          `Completed: ${basicData.companyName} — ${basicData.emails.length} emails, ${basicData.phoneNumbers.length} phones`,
          url
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        logger.error(`Failed to scrape: ${message}`, url);

        results.push({
          id: companyId,
          scrapedAt: new Date().toISOString(),
          sourceUrl: url,
          status: "error",
          error: message,
          basic: {
            companyName: "Unknown",
            websiteUrl: url,
            emails: [],
            phoneNumbers: [],
          },
        });
      }
    }

    const totalTime = Date.now() - startTime;
    const successCount = results.filter(
      (r) => r.status === "success" || r.status === "partial"
    ).length;

    logger.success(
      `Scrape job complete: ${successCount}/${validUrls.length} succeeded in ${(totalTime / 1000).toFixed(1)}s`
    );

    const response: ScrapeResponse = {
      results,
      logs: logger.getLogs(),
      totalTime,
    };

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    logger.error(message);
    return NextResponse.json(
      { error: message, logs: logger.getLogs() },
      { status: 500 }
    );
  }
}
