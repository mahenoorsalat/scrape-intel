// ============================================================
// ScrapeIntel — TypeScript Type Definitions
// ============================================================

/** Extraction depth level */
export type ExtractionLevel = 1 | 2 | 3;

/** Status of a single scrape job item */
export type ScrapeStatus = "pending" | "scraping" | "success" | "error" | "partial";

/** Log severity */
export type LogSeverity = "info" | "warn" | "error" | "success";

// ---- Data Models ----

/** Level 1 — Basic company data */
export interface BasicCompanyData {
  companyName: string;
  websiteUrl: string;
  emails: string[];
  phoneNumbers: string[];
}

/** Level 2 — Medium / enhanced details */
export interface MediumCompanyData {
  socialProfiles: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
  };
  address?: string;
  description?: string;
  yearFounded?: string;
  industry?: string;
  productsServices?: string[];
}

/** Level 3 — Advanced / comprehensive insights */
export interface AdvancedCompanyData {
  techStack: string[];
  currentProjects?: string[];
  competitors?: string[];
  marketPositioning?: string;
  companySizeEstimate?: string;
  fundingStage?: string;
}

/** Complete company data combining all levels */
export interface CompanyData {
  // Metadata
  id: string;
  scrapedAt: string;
  sourceUrl: string;
  status: ScrapeStatus;
  error?: string;

  // Level 1
  basic: BasicCompanyData;

  // Level 2 (optional)
  medium?: MediumCompanyData;

  // Level 3 (optional)
  advanced?: AdvancedCompanyData;
}

/** A single log entry */
export interface LogEntry {
  id: string;
  timestamp: string;
  severity: LogSeverity;
  message: string;
  url?: string;
}

/** Input mode for the scraping form */
export type InputMode = "query" | "urls";

/** Request body for /api/search */
export interface SearchRequest {
  query: string;
}

/** Response from /api/search */
export interface SearchResponse {
  urls: string[];
  logs: LogEntry[];
}

/** Request body for /api/scrape */
export interface ScrapeRequest {
  urls: string[];
  extractionLevel: ExtractionLevel;
}

/** Response from /api/scrape */
export interface ScrapeResponse {
  results: CompanyData[];
  logs: LogEntry[];
  totalTime: number;
}

/** Request body for /api/export */
export interface ExportRequest {
  results: CompanyData[];
  format: "csv" | "json";
}
