// ============================================================
// ScrapeIntel — Logger Utility
// ============================================================

import { LogEntry, LogSeverity } from "./types";

let logIdCounter = 0;

/**
 * Create a new log entry.
 */
export function createLog(
  severity: LogSeverity,
  message: string,
  url?: string
): LogEntry {
  logIdCounter++;
  return {
    id: `log-${logIdCounter}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    severity,
    message,
    url,
  };
}

/**
 * Logger class that collects log entries in memory.
 */
export class Logger {
  private logs: LogEntry[] = [];

  info(message: string, url?: string) {
    const entry = createLog("info", message, url);
    this.logs.push(entry);
    console.log(`[INFO] ${message}${url ? ` (${url})` : ""}`);
    return entry;
  }

  warn(message: string, url?: string) {
    const entry = createLog("warn", message, url);
    this.logs.push(entry);
    console.warn(`[WARN] ${message}${url ? ` (${url})` : ""}`);
    return entry;
  }

  error(message: string, url?: string) {
    const entry = createLog("error", message, url);
    this.logs.push(entry);
    console.error(`[ERROR] ${message}${url ? ` (${url})` : ""}`);
    return entry;
  }

  success(message: string, url?: string) {
    const entry = createLog("success", message, url);
    this.logs.push(entry);
    console.log(`[SUCCESS] ${message}${url ? ` (${url})` : ""}`);
    return entry;
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
  }
}
