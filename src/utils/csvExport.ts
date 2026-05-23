// ============================================================
// ScrapeIntel — CSV Export Utility
// ============================================================

import { CompanyData } from "@/lib/types";

/**
 * Flatten a CompanyData object into a flat key-value record for CSV export.
 */
function flattenCompanyData(company: CompanyData): Record<string, string> {
  const row: Record<string, string> = {};

  // Metadata
  row["ID"] = company.id;
  row["Scraped At"] = company.scrapedAt;
  row["Source URL"] = company.sourceUrl;
  row["Status"] = company.status;
  row["Error"] = company.error || "";

  // Level 1 — Basic
  row["Company Name"] = company.basic.companyName;
  row["Website URL"] = company.basic.websiteUrl;
  row["Emails"] = company.basic.emails.join("; ");
  row["Phone Numbers"] = company.basic.phoneNumbers.join("; ");

  // Level 2 — Medium
  if (company.medium) {
    row["LinkedIn"] = company.medium.socialProfiles.linkedin || "";
    row["Twitter"] = company.medium.socialProfiles.twitter || "";
    row["Facebook"] = company.medium.socialProfiles.facebook || "";
    row["Instagram"] = company.medium.socialProfiles.instagram || "";
    row["YouTube"] = company.medium.socialProfiles.youtube || "";
    row["GitHub"] = company.medium.socialProfiles.github || "";
    row["Address"] = company.medium.address || "";
    row["Description"] = company.medium.description || "";
    row["Year Founded"] = company.medium.yearFounded || "";
    row["Industry"] = company.medium.industry || "";
    row["Products/Services"] = (company.medium.productsServices || []).join("; ");
  }

  // Level 3 — Advanced
  if (company.advanced) {
    row["Tech Stack"] = company.advanced.techStack.join("; ");
    row["Current Projects"] = (company.advanced.currentProjects || []).join("; ");
    row["Competitors"] = (company.advanced.competitors || []).join("; ");
    row["Market Positioning"] = company.advanced.marketPositioning || "";
    row["Company Size"] = company.advanced.companySizeEstimate || "";
    row["Funding Stage"] = company.advanced.fundingStage || "";
  }

  return row;
}

/**
 * Escape a CSV field value — wrap in quotes if it contains commas, quotes, or newlines.
 */
function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert an array of CompanyData objects to CSV string.
 */
export function convertToCSV(results: CompanyData[]): string {
  if (results.length === 0) return "";

  // Flatten all results
  const rows = results.map(flattenCompanyData);

  // Get all unique headers
  const headers = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row)))
  );

  // Build CSV
  const headerLine = headers.map(escapeCsvField).join(",");
  const dataLines = rows.map((row) =>
    headers.map((header) => escapeCsvField(row[header] || "")).join(",")
  );

  return [headerLine, ...dataLines].join("\n");
}
