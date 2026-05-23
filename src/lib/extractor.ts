// ============================================================
// ScrapeIntel — Data Extractor
// Extracts structured company data from parsed HTML
// ============================================================

import * as cheerio from "cheerio";
import { BasicCompanyData, MediumCompanyData } from "./types";

// ---- Email Extraction ----

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

/** Emails to exclude (common false positives) */
const EMAIL_BLACKLIST = new Set([
  "example@example.com",
  "your@email.com",
  "email@example.com",
  "name@domain.com",
  "user@domain.com",
  "test@test.com",
  "info@example.com",
  "support@example.com",
]);

/**
 * Extract email addresses from HTML text.
 */
export function extractEmails(html: string): string[] {
  const matches = html.match(EMAIL_REGEX) || [];
  const unique = [...new Set(matches.map((e) => e.toLowerCase()))];
  return unique.filter(
    (e) =>
      !EMAIL_BLACKLIST.has(e) &&
      !e.endsWith(".png") &&
      !e.endsWith(".jpg") &&
      !e.endsWith(".svg") &&
      !e.endsWith(".gif") &&
      !e.endsWith(".webp") &&
      !e.includes("wixpress") &&
      !e.includes("sentry") &&
      !e.includes("cloudflare") &&
      e.length < 60
  );
}

// ---- Phone Extraction ----

const PHONE_PATTERNS = [
  /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // US/CA
  /\+?\d{1,3}[-.\s]?\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, // International
  /\+\d{10,15}/g, // Plain international
];

/**
 * Extract phone numbers from HTML text.
 */
export function extractPhoneNumbers(html: string, $: cheerio.CheerioAPI): string[] {
  const phones = new Set<string>();

  // From tel: links
  $('a[href^="tel:"]').each((_, el) => {
    const tel = $(el).attr("href")?.replace("tel:", "").trim();
    if (tel && tel.length >= 7) {
      phones.add(tel);
    }
  });

  // From text content using regex
  const textContent = $("body").text();
  for (const pattern of PHONE_PATTERNS) {
    const matches = textContent.match(pattern) || [];
    for (const match of matches) {
      const cleaned = match.replace(/\s+/g, " ").trim();
      // Only include numbers with at least 7 digits
      const digits = cleaned.replace(/\D/g, "");
      if (digits.length >= 7 && digits.length <= 15) {
        phones.add(cleaned);
      }
    }
  }

  return [...phones].slice(0, 5); // Limit to 5
}

// ---- Company Name Extraction ----

/**
 * Extract the company name using multiple signals.
 */
export function extractCompanyName($: cheerio.CheerioAPI, url: string): string {
  // Priority order:
  // 1. og:site_name (most reliable for company name)
  const ogSiteName = $('meta[property="og:site_name"]').attr("content")?.trim();
  if (ogSiteName && ogSiteName.length > 1 && ogSiteName.length < 100) {
    return ogSiteName;
  }

  // 2. Schema.org organization name
  const schemaOrg = $('script[type="application/ld+json"]')
    .toArray()
    .map((el) => {
      try {
        return JSON.parse($(el).html() || "");
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .find(
      (data) =>
        data["@type"] === "Organization" ||
        data["@type"] === "Corporation" ||
        data["@type"] === "LocalBusiness"
    );

  if (schemaOrg?.name) {
    return schemaOrg.name;
  }

  // 3. Title tag (clean up common suffixes)
  const title = $("title").text().trim();
  if (title) {
    // Remove common suffixes like "| Home", "- Official Site", etc.
    const cleaned = title
      .split(/\s*[|\-–—:]\s*/)[0]
      .trim();
    if (cleaned.length > 1 && cleaned.length < 80) {
      return cleaned;
    }
  }

  // 4. First h1
  const h1 = $("h1").first().text().trim();
  if (h1 && h1.length > 1 && h1.length < 80) {
    return h1;
  }

  // 5. Domain name as fallback
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return hostname.split(".")[0].charAt(0).toUpperCase() + hostname.split(".")[0].slice(1);
  } catch {
    return "Unknown Company";
  }
}

// ---- Basic Data Extraction (Level 1) ----

/**
 * Extract Level 1 (Basic) company data.
 */
export function extractBasicData(
  html: string,
  $: cheerio.CheerioAPI,
  url: string
): BasicCompanyData {
  return {
    companyName: extractCompanyName($, url),
    websiteUrl: url,
    emails: extractEmails(html),
    phoneNumbers: extractPhoneNumbers(html, $),
  };
}

// ---- Social Media Extraction ----

const SOCIAL_PATTERNS: Record<string, RegExp> = {
  linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9\-._~]+\/?/i,
  twitter: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?/i,
  facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[a-zA-Z0-9.\-]+\/?/i,
  instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?/i,
  youtube: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:@|channel\/|c\/)[a-zA-Z0-9\-._~]+\/?/i,
  github: /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9\-]+\/?/i,
};

/**
 * Extract social media profile URLs from links on the page.
 */
export function extractSocialProfiles(
  $: cheerio.CheerioAPI
): MediumCompanyData["socialProfiles"] {
  const profiles: MediumCompanyData["socialProfiles"] = {};
  const links = $("a[href]")
    .toArray()
    .map((el) => $(el).attr("href") || "");

  for (const link of links) {
    for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
      if (!profiles[platform as keyof typeof profiles] && pattern.test(link)) {
        const match = link.match(pattern);
        if (match) {
          let profileUrl = match[0];
          if (!profileUrl.startsWith("http")) {
            profileUrl = "https://" + profileUrl;
          }
          profiles[platform as keyof typeof profiles] = profileUrl;
        }
      }
    }
  }

  return profiles;
}

// ---- Address Extraction ----

/**
 * Extract physical address from structured data or common patterns.
 */
export function extractAddress($: cheerio.CheerioAPI): string | undefined {
  // Check Schema.org structured data
  const schemas = $('script[type="application/ld+json"]')
    .toArray()
    .map((el) => {
      try {
        return JSON.parse($(el).html() || "");
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  for (const schema of schemas) {
    if (schema.address) {
      const addr = schema.address;
      if (typeof addr === "string") return addr;
      if (typeof addr === "object") {
        const parts = [
          addr.streetAddress,
          addr.addressLocality,
          addr.addressRegion,
          addr.postalCode,
          addr.addressCountry,
        ].filter(Boolean);
        if (parts.length > 0) return parts.join(", ");
      }
    }
  }

  // Check common address elements
  const addressEl = $("address").first().text().trim();
  if (addressEl && addressEl.length > 5 && addressEl.length < 300) {
    return addressEl.replace(/\s+/g, " ");
  }

  return undefined;
}

// ---- Description Extraction ----

/**
 * Extract company description from meta tags and structured data.
 */
export function extractDescription($: cheerio.CheerioAPI): string | undefined {
  // Priority: og:description > meta description > schema description
  const ogDesc = $('meta[property="og:description"]').attr("content")?.trim();
  if (ogDesc && ogDesc.length > 10) return ogDesc;

  const metaDesc = $('meta[name="description"]').attr("content")?.trim();
  if (metaDesc && metaDesc.length > 10) return metaDesc;

  // Schema.org
  const schemas = $('script[type="application/ld+json"]')
    .toArray()
    .map((el) => {
      try {
        return JSON.parse($(el).html() || "");
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  for (const schema of schemas) {
    if (schema.description && schema.description.length > 10) {
      return schema.description;
    }
  }

  return undefined;
}

// ---- Medium Data Extraction (Level 2) ----

/**
 * Extract Level 2 (Medium) company data.
 */
export function extractMediumData(
  $: cheerio.CheerioAPI
): MediumCompanyData {
  return {
    socialProfiles: extractSocialProfiles($),
    address: extractAddress($),
    description: extractDescription($),
    industry: undefined, // Will be enriched by AI
    productsServices: undefined, // Will be enriched by AI
    yearFounded: undefined, // Will be enriched by AI
  };
}
