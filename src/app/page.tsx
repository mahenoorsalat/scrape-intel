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
const Icons = {
  search: "🔍",
  link: "🔗",
  scrape: "⚡",
  email: "📧",
  phone: "📞",
  social: "🌐",
  tech: "💻",
  building: "🏢",
  target: "🎯",
  chart: "📊",
  download: "⬇️",
  copy: "📋",
  expand: "▼",
  log: "📜",
  success: "✅",
  warning: "⚠️",
  error: "❌",
  info: "ℹ️",
  clock: "🕐",
  globe: "🌍",
  sparkle: "✨",
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
  const successCount = results.filter((r) => r.status === "success").length;
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

      {/* Main */}
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

        {/* Input Section */}
        <section className="card fade-in fade-in-delay-1">
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

          {/* Seed URLs Input */}
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
                Name, website, emails, phones
              </div>
            </div>
            <div
              className={`level-card ${extractionLevel === 2 ? "level-card--selected" : ""}`}
              onClick={() => !isLoading && setExtractionLevel(2)}
            >
              <div className="level-card__badge">Popular</div>
              <div className="level-card__icon">{Icons.chart}</div>
              <div className="level-card__name">Enhanced</div>
              <div className="level-card__desc">
                + Social profiles, address, description
              </div>
            </div>
            <div
              className={`level-card ${extractionLevel === 3 ? "level-card--selected" : ""}`}
              onClick={() => !isLoading && setExtractionLevel(3)}
            >
              <div className="level-card__badge">AI ✨</div>
              <div className="level-card__icon">{Icons.sparkle}</div>
              <div className="level-card__name">Comprehensive</div>
              <div className="level-card__desc">
                + Tech stack, competitors, AI insights
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

        {/* Discovered URLs (from search) */}
        {discoveredUrls.length > 0 && !isScraping && results.length === 0 && (
          <section className="card fade-in" style={{ marginTop: "24px" }}>
            <div className="card__header">
              <span className="card__title">
                {Icons.globe} Discovered {discoveredUrls.length} Company Websites
              </span>
            </div>
            <ul className="detail-section__list">
              {discoveredUrls.map((url, i) => (
                <li key={i}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <section className="results fade-in" ref={resultsRef}>
            {/* Stats Bar */}
            <div className="stats-bar">
              <div className="stats-bar__item">
                <span className="stats-bar__value">{results.length}</span>
                <span className="stats-bar__label">Companies</span>
              </div>
              <div className="stats-bar__divider" />
              <div className="stats-bar__item">
                <span className="stats-bar__value">{successCount}</span>
                <span className="stats-bar__label">Success</span>
              </div>
              {partialCount > 0 && (
                <>
                  <div className="stats-bar__divider" />
                  <div className="stats-bar__item">
                    <span className="stats-bar__value">{partialCount}</span>
                    <span className="stats-bar__label">Partial</span>
                  </div>
                </>
              )}
              {errorCount > 0 && (
                <>
                  <div className="stats-bar__divider" />
                  <div className="stats-bar__item">
                    <span className="stats-bar__value">{errorCount}</span>
                    <span className="stats-bar__label">Failed</span>
                  </div>
                </>
              )}
              <div className="stats-bar__divider" />
              <div className="stats-bar__item">
                <span className="stats-bar__value">{totalEmails}</span>
                <span className="stats-bar__label">Emails</span>
              </div>
              <div className="stats-bar__divider" />
              <div className="stats-bar__item">
                <span className="stats-bar__value">{totalPhones}</span>
                <span className="stats-bar__label">Phones</span>
              </div>
              {totalTime && (
                <>
                  <div className="stats-bar__divider" />
                  <div className="stats-bar__item">
                    <span className="stats-bar__value">
                      {(totalTime / 1000).toFixed(1)}s
                    </span>
                    <span className="stats-bar__label">Total Time</span>
                  </div>
                </>
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
                  {Icons.copy} Copy
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
        )}

        {/* Log Panel */}
        {logs.length > 0 && (
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
        )}

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

  return (
    <div className={`company-card ${status === "error" ? "company-card--error" : ""}`}>
      {/* Main Row */}
      <div className="company-card__main" onClick={onToggle}>
        <div className="company-card__info">
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
            <div style={{ fontSize: "13px", color: "var(--color-error)" }}>
              {companyError}
            </div>
          ) : (
            <div className="company-card__quick-stats">
              <span className="company-card__stat">
                <span className="company-card__stat-icon">📧</span>
                {basic.emails.length} email{basic.emails.length !== 1 ? "s" : ""}
              </span>
              <span className="company-card__stat">
                <span className="company-card__stat-icon">📞</span>
                {basic.phoneNumbers.length} phone{basic.phoneNumbers.length !== 1 ? "s" : ""}
              </span>
              {medium?.socialProfiles && Object.values(medium.socialProfiles).filter(Boolean).length > 0 && (
                <span className="company-card__stat">
                  <span className="company-card__stat-icon">🌐</span>
                  {Object.values(medium.socialProfiles).filter(Boolean).length} social
                </span>
              )}
              {advanced?.techStack && advanced.techStack.length > 0 && (
                <span className="company-card__stat">
                  <span className="company-card__stat-icon">💻</span>
                  {advanced.techStack.length} tech
                </span>
              )}
            </div>
          )}
        </div>

        <button
          className={`company-card__toggle ${isExpanded ? "company-card__toggle--open" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          ▼
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && status !== "error" && (
        <div className="company-card__details">
          {/* Emails */}
          {basic.emails.length > 0 && (
            <div className="detail-section">
              <div className="detail-section__title">📧 Emails</div>
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
              <div className="detail-section__title">📞 Phone Numbers</div>
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
              <div className="detail-section__title">📝 Description</div>
              <p className="description-text">{medium.description}</p>
            </div>
          )}

          {/* Social Profiles */}
          {medium?.socialProfiles &&
            Object.values(medium.socialProfiles).some(Boolean) && (
              <div className="detail-section">
                <div className="detail-section__title">🌐 Social Profiles</div>
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
              <div className="detail-section__title">📍 Address</div>
              <div className="detail-section__content">{medium.address}</div>
            </div>
          )}

          {/* Industry */}
          {medium?.industry && (
            <div className="detail-section">
              <div className="detail-section__title">🏭 Industry</div>
              <div className="detail-section__content">{medium.industry}</div>
            </div>
          )}

          {/* Year Founded */}
          {medium?.yearFounded && (
            <div className="detail-section">
              <div className="detail-section__title">📅 Founded</div>
              <div className="detail-section__content">{medium.yearFounded}</div>
            </div>
          )}

          {/* Products / Services */}
          {medium?.productsServices && medium.productsServices.length > 0 && (
            <div className="detail-section">
              <div className="detail-section__title">🛍️ Products & Services</div>
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
              <div className="detail-section__title">💻 Tech Stack</div>
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
              <div className="detail-section__title">⚔️ Competitors</div>
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
              <div className="detail-section__title">📊 Market Position</div>
              <div className="detail-section__content">
                {advanced.marketPositioning}
              </div>
            </div>
          )}

          {/* Current Projects */}
          {advanced?.currentProjects && advanced.currentProjects.length > 0 && (
            <div className="detail-section">
              <div className="detail-section__title">🚀 Current Projects</div>
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
              <div className="detail-section__title">📈 Company Details</div>
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
