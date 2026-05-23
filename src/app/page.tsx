"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  CompanyData,
  ExtractionLevel,
  InputMode,
  LogEntry,
  ScrapeResponse,
  SearchResponse,
} from "@/lib/types";

// ---- Icons (inline SVG helpers) ----
// ---- Icons (Clean Inline SVGs) ----
const Icons = {
  search: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  link: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
  ),
  scrape: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  ),
  email: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  ),
  phone: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
  ),
  social: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  ),
  tech: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
  ),
  building: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
      <line x1="9" y1="22" x2="9" y2="16"></line>
      <line x1="15" y1="22" x2="15" y2="16"></line>
      <line x1="9" y1="16" x2="15" y2="16"></line>
      <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M12 6h.01M12 10h.01"></path>
    </svg>
  ),
  target: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block" }}>
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  ),
  chart: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block" }}>
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  ),
  download: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  ),
  copy: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  ),
  expand: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  ),
  log: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  ),
  success: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block" }}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ),
  warning: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block" }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  error: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block" }}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block" }}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  ),
  globe: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      <line x1="2" y1="12" x2="22" y2="12"></line>
    </svg>
  ),
  sparkle: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  ),
};

export default function HomePage() {
  // ---- State ----
  const [inputMode, setInputMode] = useState<InputMode>("query");
  const [searchQuery, setSearchQuery] = useState("");
  const [seedUrls, setSeedUrls] = useState("");
  const [extractionLevel, setExtractionLevel] = useState<ExtractionLevel>(2);
  const [isSearching, setIsSearching] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [discoveredUrls, setDiscoveredUrls] = useState<string[]>([]);
  const [results, setResults] = useState<CompanyData[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showLogs, setShowLogs] = useState(true);
  const [totalTime, setTotalTime] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const logEndRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // ---- Handlers ----

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setDiscoveredUrls([]);
    setResults([]);
    setLogs([]);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });

      const data: SearchResponse & { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Search failed");
      }

      setDiscoveredUrls(data.urls);
      setLogs(data.logs);

      if (data.urls.length === 0) {
        setError("No company websites found for this query. Try a different search.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";
      setError(message);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleScrape = useCallback(async (urls?: string[]) => {
    const urlsToScrape = urls || (inputMode === "urls"
      ? seedUrls
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean)
      : discoveredUrls);

    if (urlsToScrape.length === 0) {
      setError("No URLs to scrape. Enter URLs or search for companies first.");
      return;
    }

    setIsScraping(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: urlsToScrape,
          extractionLevel,
        }),
      });

      const data: ScrapeResponse & { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Scraping failed");
      }

      setResults(data.results);
      setLogs((prev) => [...prev, ...data.logs]);
      setTotalTime(data.totalTime);

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Scraping failed";
      setError(message);
    } finally {
      setIsScraping(false);
    }
  }, [inputMode, seedUrls, discoveredUrls, extractionLevel]);

  const handleSearchAndScrape = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setDiscoveredUrls([]);
    setResults([]);
    setLogs([]);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });

      const data: SearchResponse & { error?: string } = await res.json();

      if (!res.ok) throw new Error(data.error || "Search failed");

      setDiscoveredUrls(data.urls);
      setLogs(data.logs);
      setIsSearching(false);

      if (data.urls.length > 0) {
        await handleScrape(data.urls);
      } else {
        setError("No company websites found for this query.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";
      setError(message);
      setIsSearching(false);
    }
  }, [searchQuery, handleScrape]);

  const handleExport = useCallback(async (format: "csv" | "json") => {
    if (results.length === 0) return;

    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results, format }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scrape-intel-results.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  }, [results]);

  const handleCopyJSON = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  }, [results]);

  const toggleCard = useCallback((id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Stats
  const successCount = results.filter((r) => r.status === "success" || r.status === "partial").length;
  const partialCount = results.filter((r) => r.status === "partial").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const totalEmails = results.reduce((sum, r) => sum + r.basic.emails.length, 0);
  const totalPhones = results.reduce((sum, r) => sum + r.basic.phoneNumbers.length, 0);

  const isLoading = isSearching || isScraping;

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header__brand">
          <div className="header__logo">S</div>
          <div>
            <h1 className="header__title">ScrapeIntel</h1>
            <p className="header__tagline">AI-Powered Company Intelligence</p>
          </div>
        </div>
        <div className="header__badge">
          <span className="header__badge-dot" />
          Ready
        </div>
      </header>

      {/* Main Container */}
      <main className="main">
        {/* Hero */}
        <section className="hero fade-in">
          <h2 className="hero__title">
            Discover & Analyze{" "}
            <span className="hero__title-gradient">Company Intelligence</span>
          </h2>
          <p className="hero__subtitle">
            Enter a search query or provide company URLs to extract detailed
            business data including contacts, tech stack, competitors, and
            AI-powered insights.
          </p>
        </section>

        {/* Dribbble 2-Column Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Left Column: Input Console & Activity Logs */}
          <div className="dashboard-grid__left">
            {/* Input card */}
            <section className="card fade-in fade-in-delay-1" style={{ marginBottom: "24px" }}>
              {/* Mode Toggle */}
              <div className="mode-toggle">
                <button
                  className={`mode-toggle__btn ${inputMode === "query" ? "mode-toggle__btn--active" : ""}`}
                  onClick={() => setInputMode("query")}
                  disabled={isLoading}
                >
                  {Icons.search} Search Query
                </button>
                <button
                  className={`mode-toggle__btn ${inputMode === "urls" ? "mode-toggle__btn--active" : ""}`}
                  onClick={() => setInputMode("urls")}
                  disabled={isLoading}
                >
                  {Icons.link} Seed URLs
                </button>
              </div>

              {/* Search Query Input */}
              {inputMode === "query" && (
                <div className="form-group">
                  <label className="form-label" htmlFor="search-query">
                    Search Query
                  </label>
                  <input
                    id="search-query"
                    className="form-input"
                    type="text"
                    placeholder='e.g., "cloud computing startups in Europe"'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchAndScrape()}
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Company URLs Input */}
              {inputMode === "urls" && (
                <div className="form-group">
                  <label className="form-label" htmlFor="seed-urls">
                    Company URLs (one per line)
                  </label>
                  <textarea
                    id="seed-urls"
                    className="form-input form-textarea"
                    placeholder={"https://stripe.com\nhttps://notion.so\nhttps://vercel.com"}
                    value={seedUrls}
                    onChange={(e) => setSeedUrls(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Extraction Level */}
              <label className="form-label">Extraction Depth</label>
              <div className="level-selector">
                <div
                  className={`level-card ${extractionLevel === 1 ? "level-card--selected" : ""}`}
                  onClick={() => !isLoading && setExtractionLevel(1)}
                >
                  <div className="level-card__icon">{Icons.target}</div>
                  <div className="level-card__name">Basic</div>
                  <div className="level-card__desc">
                    Name, website, contacts
                  </div>
                </div>
                <div
                  className={`level-card ${extractionLevel === 2 ? "level-card--selected" : ""}`}
                  onClick={() => !isLoading && setExtractionLevel(2)}
                >
                  <div className="level-card__badge" style={{ backgroundColor: "var(--accent-primary)", color: "white" }}>Popular</div>
                  <div className="level-card__icon">{Icons.chart}</div>
                  <div className="level-card__name">Enhanced</div>
                  <div className="level-card__desc">
                    + Socials, metadata
                  </div>
                </div>
                <div
                  className={`level-card ${extractionLevel === 3 ? "level-card--selected" : ""}`}
                  onClick={() => !isLoading && setExtractionLevel(3)}
                >
                  <div className="level-card__badge" style={{ backgroundColor: "var(--text-primary)", color: "white" }}>AI ✨</div>
                  <div className="level-card__icon">{Icons.sparkle}</div>
                  <div className="level-card__name">Comprehensive</div>
                  <div className="level-card__desc">
                    + Stack, AI insights
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                className="btn btn--primary btn--full"
                onClick={inputMode === "query" ? handleSearchAndScrape : () => handleScrape()}
                disabled={
                  isLoading ||
                  (inputMode === "query" && !searchQuery.trim()) ||
                  (inputMode === "urls" && !seedUrls.trim())
                }
              >
                {isLoading ? (
                  <>
                    <span className="btn__spinner" />
                    {isSearching ? "Searching..." : "Scraping..."}
                  </>
                ) : (
                  <>
                    {Icons.scrape}{" "}
                    {inputMode === "query"
                      ? "Search & Scrape"
                      : "Start Scraping"}
                  </>
                )}
              </button>
            </section>

            {/* Error Message */}
            {error && (
              <div className="error-message fade-in">
                {Icons.error} {error}
              </div>
            )}

            {/* Log Panel */}
            {logs.length > 0 ? (
              <div className="log-panel fade-in">
                <div
                  className="log-panel__header"
                  onClick={() => setShowLogs(!showLogs)}
                >
                  <span className="log-panel__title">
                    {Icons.log} Activity Log
                    <span className="log-panel__count">{logs.length}</span>
                  </span>
                  <span
                    className="log-panel__toggle"
                    style={{
                      transform: showLogs ? "rotate(180deg)" : "rotate(0deg)",
                      display: "inline-block",
                    }}
                  >
                    {Icons.expand}
                  </span>
                </div>
                {showLogs && (
                  <div className="log-panel__body">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className={`log-entry log-entry--${log.severity}`}
                      >
                        <span className="log-entry__time">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="log-entry__icon">
                          {log.severity === "success"
                            ? Icons.success
                            : log.severity === "error"
                              ? Icons.error
                              : log.severity === "warn"
                                ? Icons.warning
                                : Icons.info}
                        </span>
                        <span className="log-entry__message">
                          {log.message}
                          {log.url && (
                            <span className="log-entry__url"> [{log.url}]</span>
                          )}
                        </span>
                      </div>
                    ))}
                    <div ref={logEndRef} />
                  </div>
                )}
              </div>
            ) : (
              <div className="card fade-in" style={{ padding: "20px", background: "var(--bg-tertiary)", borderColor: "transparent" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ color: "var(--accent-primary)", display: "flex", alignItems: "center" }}>{Icons.scrape}</span>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: "700" }}>System Console</h4>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Awaiting intelligence scraping job...</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Statistics & Results */}
          <div className="dashboard-grid__right">
            {results.length > 0 ? (
              <section className="results fade-in" style={{ marginTop: 0 }} ref={resultsRef}>
                {/* Dribbble Style Stats Bar */}
                <div className="stats-bar">
                  <div className="stats-bar__item">
                    <span className="stats-bar__value">{results.length}</span>
                    <span className="stats-bar__label">Companies</span>
                  </div>
                  <div className="stats-bar__item">
                    <span className="stats-bar__value">{successCount}</span>
                    <span className="stats-bar__label">Success</span>
                  </div>
                  <div className="stats-bar__item">
                    <span className="stats-bar__value">{totalEmails}</span>
                    <span className="stats-bar__label">Emails Found</span>
                  </div>
                  <div className="stats-bar__item">
                    <span className="stats-bar__value">{totalPhones}</span>
                    <span className="stats-bar__label">Phones Found</span>
                  </div>
                  {totalTime && (
                    <div className="stats-bar__item">
                      <span className="stats-bar__value">
                        {(totalTime / 1000).toFixed(1)}s
                      </span>
                      <span className="stats-bar__label">Total Time</span>
                    </div>
                  )}
                </div>

                {/* Header + Export */}
                <div className="results__header">
                  <h3 className="results__title">
                    {Icons.building} Scraped Companies
                    <span className="results__count">
                      ({results.length} results)
                    </span>
                  </h3>
                  <div className="results__actions">
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={() => handleExport("json")}
                    >
                      {Icons.download} JSON
                    </button>
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={() => handleExport("csv")}
                    >
                      {Icons.download} CSV
                    </button>
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={handleCopyJSON}
                    >
                      {Icons.copy} Copy JSON
                    </button>
                  </div>
                </div>

                {/* Company Cards */}
                <div className="results-grid">
                  {results.map((company) => (
                    <CompanyCard
                      key={company.id}
                      company={company}
                      isExpanded={expandedCards.has(company.id)}
                      onToggle={() => toggleCard(company.id)}
                    />
                  ))}
                </div>
              </section>
            ) : discoveredUrls.length > 0 && !isScraping ? (
              <section className="card fade-in" style={{ minHeight: "450px" }}>
                <div className="card__header">
                  <span className="card__title">
                    {Icons.globe} Discovered {discoveredUrls.length} Company Websites
                  </span>
                </div>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                  The following websites were discovered for your query. Click **"Search & Scrape"** on the left console to extract detailed business profiles!
                </p>
                <ul className="detail-section__list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {discoveredUrls.map((url, i) => (
                    <li key={i} style={{ padding: "8px 12px", background: "var(--bg-tertiary)", borderRadius: "8px" }}>
                      <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: "600" }}>
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              /* Dribbble Style Welcome / Empty State */
              <div className="card fade-in fade-in-delay-2" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "530px", textAlign: "center", borderStyle: "dashed", borderWidth: "2px" }}>
                <div style={{ color: "var(--accent-primary)", marginBottom: "20px", opacity: 0.8 }}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "10px" }}>No Intelligence Gathered Yet</h3>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "440px", lineHeight: "1.7" }}>
                  Use the left console to enter a search query or seed URLs. The scraper will extract full company contacts, tech stack, competitors, and AI-powered insights.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Copy success toast */}
        {copySuccess && (
          <div className="copy-success">
            {Icons.success} Copied to clipboard!
          </div>
        )}
      </main>
    </>
  );
}

// ============================================================
// Company Card Component
// ============================================================

function CompanyCard({
  company,
  isExpanded,
  onToggle,
}: {
  company: CompanyData;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { basic, medium, advanced, status, error: companyError } = company;

  const statusClass =
    status === "success"
      ? "status-badge--success"
      : status === "partial"
        ? "status-badge--partial"
        : "status-badge--error";

  const statusLabel =
    status === "success"
      ? "Success"
      : status === "partial"
        ? "Partial"
        : "Error";

  // Generate a distinct avatar styling based on company name
  const getAvatarStyle = (name: string) => {
    const colors = [
      { bg: "#ffe8e2", fg: "#ff5c35", emoji: "🏢" }, // Coral Office
      { bg: "#e0f2fe", fg: "#0284c7", emoji: "💻" }, // Blue Laptop
      { bg: "#ecfdf5", fg: "#059669", emoji: "⚡" }, // Green Bolt
      { bg: "#f5f3ff", fg: "#7c3aed", emoji: "🎯" }, // Purple Target
      { bg: "#fff7ed", fg: "#ea580c", emoji: "🌐" }, // Orange Globe
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  const avatar = getAvatarStyle(basic.companyName);

  return (
    <div className={`company-card ${status === "error" ? "company-card--error" : ""}`}>
      {/* Main Row */}
      <div className="company-card__main" onClick={onToggle}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", minWidth: 0, width: "100%" }}>
          {/* Branded Visual Avatar (High-end Typography Monogram) */}
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            backgroundColor: avatar.bg,
            color: avatar.fg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            fontFamily: "var(--font-header)",
            fontWeight: "800",
            flexShrink: 0,
            boxShadow: "0 4px 10px rgba(0,0,0,0.02)",
          }}>
            {basic.companyName.charAt(0).toUpperCase()}
          </div>

          <div className="company-card__info" style={{ flex: 1, minWidth: 0 }}>
            <div className="company-card__name">
              {basic.companyName}
              <span className={`status-badge ${statusClass}`}>
                {statusLabel}
              </span>
            </div>
            <div className="company-card__url">
              <a
                href={basic.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {basic.websiteUrl}
              </a>
            </div>

            {companyError ? (
              <div style={{ fontSize: "13px", color: "var(--color-error)", fontWeight: "500" }}>
                {companyError}
              </div>
            ) : (
              <div className="company-card__quick-stats">
                <span className="company-card__stat">
                  <span className="company-card__stat-icon" style={{ display: "flex", alignItems: "center" }}>{Icons.email}</span>
                  {basic.emails.length} email{basic.emails.length !== 1 ? "s" : ""}
                </span>
                <span className="company-card__stat">
                  <span className="company-card__stat-icon" style={{ display: "flex", alignItems: "center" }}>{Icons.phone}</span>
                  {basic.phoneNumbers.length} phone{basic.phoneNumbers.length !== 1 ? "s" : ""}
                </span>
                {medium?.socialProfiles && Object.values(medium.socialProfiles).filter(Boolean).length > 0 && (
                  <span className="company-card__stat">
                    <span className="company-card__stat-icon" style={{ display: "flex", alignItems: "center" }}>{Icons.social}</span>
                    {Object.values(medium.socialProfiles).filter(Boolean).length} social
                  </span>
                )}
                {advanced?.techStack && advanced.techStack.length > 0 && (
                  <span className="company-card__stat">
                    <span className="company-card__stat-icon" style={{ display: "flex", alignItems: "center" }}>{Icons.tech}</span>
                    {advanced.techStack.length} tech
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          className={`company-card__toggle ${isExpanded ? "company-card__toggle--open" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {Icons.expand}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && status !== "error" && (
        <div className="company-card__details">
          {/* Emails */}
          {basic.emails.length > 0 && (
            <div className="detail-section">
              <div className="detail-section__title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {Icons.email} Emails
              </div>
              <ul className="detail-section__list">
                {basic.emails.map((email, i) => (
                  <li key={i}>
                    <a href={`mailto:${email}`}>{email}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Phone Numbers */}
          {basic.phoneNumbers.length > 0 && (
            <div className="detail-section">
              <div className="detail-section__title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {Icons.phone} Phone Numbers
              </div>
              <ul className="detail-section__list">
                {basic.phoneNumbers.map((phone, i) => (
                  <li key={i}>
                    <a href={`tel:${phone}`}>{phone}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Description */}
          {medium?.description && (
            <div className="detail-section">
              <div className="detail-section__title">Description</div>
              <p className="description-text">{medium.description}</p>
            </div>
          )}

          {/* Social Profiles */}
          {medium?.socialProfiles &&
            Object.values(medium.socialProfiles).some(Boolean) && (
              <div className="detail-section">
                <div className="detail-section__title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {Icons.social} Social Profiles
                </div>
                <div className="social-links">
                  {Object.entries(medium.socialProfiles)
                    .filter(([, url]) => url)
                    .map(([platform, url]) => (
                      <a
                        key={platform}
                        className="social-link"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {platform}
                      </a>
                    ))}
                </div>
              </div>
            )}

          {/* Address */}
          {medium?.address && (
            <div className="detail-section">
              <div className="detail-section__title">Address</div>
              <div className="detail-section__content">{medium.address}</div>
            </div>
          )}

          {/* Industry */}
          {medium?.industry && (
            <div className="detail-section">
              <div className="detail-section__title">Industry</div>
              <div className="detail-section__content">{medium.industry}</div>
            </div>
          )}

          {/* Year Founded */}
          {medium?.yearFounded && (
            <div className="detail-section">
              <div className="detail-section__title">Founded</div>
              <div className="detail-section__content">{medium.yearFounded}</div>
            </div>
          )}

          {/* Products / Services */}
          {medium?.productsServices && medium.productsServices.length > 0 && (
            <div className="detail-section">
              <div className="detail-section__title">Products & Services</div>
              <ul className="detail-section__list">
                {medium.productsServices.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tech Stack */}
          {advanced?.techStack && advanced.techStack.length > 0 && (
            <div className="detail-section">
              <div className="detail-section__title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {Icons.tech} Tech Stack
              </div>
              <div className="tech-badges">
                {advanced.techStack.map((tech, i) => (
                  <span key={i} className="tech-badge">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Competitors */}
          {advanced?.competitors && advanced.competitors.length > 0 && (
            <div className="detail-section">
              <div className="detail-section__title">Competitors</div>
              <ul className="detail-section__list">
                {advanced.competitors.map((comp, i) => (
                  <li key={i}>{comp}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Market Positioning */}
          {advanced?.marketPositioning && (
            <div className="detail-section">
              <div className="detail-section__title">Market Position</div>
              <div className="detail-section__content">
                {advanced.marketPositioning}
              </div>
            </div>
          )}

          {/* Current Projects */}
          {advanced?.currentProjects && advanced.currentProjects.length > 0 && (
            <div className="detail-section">
              <div className="detail-section__title">Current Projects</div>
              <ul className="detail-section__list">
                {advanced.currentProjects.map((proj, i) => (
                  <li key={i}>{proj}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Company Size & Funding */}
          {(advanced?.companySizeEstimate || advanced?.fundingStage) && (
            <div className="detail-section">
              <div className="detail-section__title">Company Details</div>
              <div className="detail-section__content">
                {advanced.companySizeEstimate && (
                  <div>Size: {advanced.companySizeEstimate}</div>
                )}
                {advanced.fundingStage && (
                  <div>Funding: {advanced.fundingStage}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
