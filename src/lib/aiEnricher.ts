// ============================================================
// ScrapeIntel — AI Enrichment via Google Gemini
// ============================================================

import { AdvancedCompanyData, MediumCompanyData } from "./types";
import { Logger } from "./logger";

interface AIEnrichmentResult {
  medium: Partial<MediumCompanyData>;
  advanced: Partial<AdvancedCompanyData>;
}

/**
 * Extract key text content from a webpage for AI analysis.
 * Strips HTML and limits length to stay within token limits.
 */
function extractTextForAI(html: string): string {
  // Remove scripts, styles, and HTML tags
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Limit to ~4000 chars to stay within token limits
  return text.slice(0, 4000);
}

/**
 * Use Google Gemini to extract structured company insights from page content.
 */
export async function enrichWithAI(
  html: string,
  companyName: string,
  url: string,
  logger: Logger
): Promise<AIEnrichmentResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    logger.warn("GEMINI_API_KEY not set — skipping AI enrichment", url);
    return null;
  }

  const pageText = extractTextForAI(html);

  if (pageText.length < 50) {
    logger.warn("Page text too short for AI analysis", url);
    return null;
  }

  const prompt = `Analyze the following webpage content from "${companyName}" (${url}) and extract structured company information. Return ONLY valid JSON with no markdown formatting, no code blocks, no explanation.

JSON schema:
{
  "industry": "string or null - the company's industry/sector",
  "yearFounded": "string or null - year the company was founded",
  "productsServices": ["array of strings - main products or services offered"],
  "competitors": ["array of strings - competitor company names mentioned or implied"],
  "marketPositioning": "string or null - brief description of market positioning (leader, challenger, niche, etc.)",
  "currentProjects": ["array of strings - any current projects, initiatives, or focus areas mentioned"],
  "companySizeEstimate": "string or null - estimated size (startup, small, medium, large, enterprise)",
  "fundingStage": "string or null - funding stage if mentioned (seed, Series A, B, C, etc.)"
}

Webpage content:
${pageText}`;

  try {
    logger.info("Running AI enrichment analysis...", url);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} — ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No response from Gemini");
    }

    // Parse JSON from response (handle potential markdown wrapping)
    const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    logger.success("AI enrichment completed", url);

    return {
      medium: {
        industry: parsed.industry || undefined,
        yearFounded: parsed.yearFounded || undefined,
        productsServices: parsed.productsServices?.length
          ? parsed.productsServices
          : undefined,
      },
      advanced: {
        competitors: parsed.competitors?.length ? parsed.competitors : undefined,
        marketPositioning: parsed.marketPositioning || undefined,
        currentProjects: parsed.currentProjects?.length
          ? parsed.currentProjects
          : undefined,
        companySizeEstimate: parsed.companySizeEstimate || undefined,
        fundingStage: parsed.fundingStage || undefined,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    logger.error(`AI enrichment failed: ${message}`, url);
    return null;
  }
}
