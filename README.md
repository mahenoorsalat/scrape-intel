# ScrapeIntel — AI-Powered Company Intelligence Scraper

<div align="center">

**Discover companies. Extract intelligence. Power your decisions.**

A full-stack web scraping tool that discovers companies from search queries or seed URLs and extracts multi-level business intelligence — from basic contact details to AI-powered competitive insights.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---

## ✨ Features Implemented

### Core Features (Minimal Requirements) ✅
- **Input Handling**: Accept search queries (e.g., "cloud computing startups in Europe") OR seed URLs
- **URL Validation**: Format validation + reachability checking with timeout handling
- **Basic Data Extraction (Level 1)**: Company name, website URL, emails, phone numbers
- **Structured Output**: JSON and CSV export with downloadable files
- **Error Handling**: Graceful error management with detailed logging

### Enhancement Features (Optional) ✅
- **Medium Data Extraction (Level 2)**: Social profiles (LinkedIn, Twitter, Facebook, Instagram, YouTube, GitHub), physical address, company description, industry
- **Advanced Data Extraction (Level 3)**: Tech stack detection (40+ technologies), competitor analysis, market positioning, AI-powered insights
- **Search Query → URL Discovery**: Google search integration via Serper.dev API
- **AI-Powered Enrichment**: Google Gemini extracts industry, competitors, funding stage, products/services from page content
- **Rate Limiting**: Request delays with random jitter to mimic human browsing behavior
- **Web Dashboard**: Beautiful, responsive dashboard with real-time progress and activity logs
- **User Agent Rotation**: Rotates between multiple browser User-Agents
- **Comprehensive Logging**: Color-coded activity log visible in the UI

---

## 📊 Data Extraction Levels

| Level | Name | Data Extracted |
|-------|------|---------------|
| **1** | Basic | Company name, website URL, emails, phone numbers |
| **2** | Enhanced | + Social profiles, address, description, industry |
| **3** | Comprehensive | + Tech stack, competitors, AI insights, market positioning, funding, projects |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Web Dashboard (React)                  │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐  │
│  │ Search Form  │ │ Results Grid │ │   Export Panel    │  │
│  │ Mode Toggle  │ │ Company Cards│ │  JSON / CSV      │  │
│  │ Level Select │ │ Detail Views │ │  Copy Clipboard   │  │
│  └─────┬───────┘ └──────┬───────┘ └────────┬─────────┘  │
│        │                │                    │            │
├────────┼────────────────┼────────────────────┼────────────┤
│        │           API Layer (Next.js)       │            │
│  ┌─────▼───────┐ ┌──────▼───────┐ ┌─────────▼────────┐  │
│  │ /api/search │ │ /api/scrape  │ │   /api/export    │  │
│  │ Serper.dev  │ │ Orchestrator │ │  CSV Generator   │  │
│  └─────────────┘ └──────┬───────┘ └──────────────────┘  │
│                         │                                 │
│              ┌──────────┼──────────┐                     │
│              ▼          ▼          ▼                     │
│  ┌──────────────┐ ┌──────────┐ ┌──────────────┐         │
│  │   Scraper    │ │Extractor │ │ AI Enricher  │         │
│  │ (Cheerio)    │ │(Regex+   │ │ (Gemini API) │         │
│  │ Rate Limited │ │ Schema)  │ │              │         │
│  └──────────────┘ └──────────┘ └──────────────┘         │
│              ┌──────────────────────┐                    │
│              │   Tech Detector      │                    │
│              │ (40+ tech patterns)  │                    │
│              └──────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Serper.dev API Key** (free tier: [serper.dev](https://serper.dev)) — for search query feature
- **Google Gemini API Key** (free tier: [aistudio.google.com](https://aistudio.google.com/apikey)) — for Level 3 AI enrichment

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/scrape-intel.git
cd scrape-intel

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local and add your API keys

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SERPER_API_KEY` | For search feature | Serper.dev API key for Google search |
| `GEMINI_API_KEY` | For Level 3 | Google Gemini API key for AI enrichment |

> **Note:** The tool works without API keys — you can still use "Seed URLs" mode with Level 1 or 2 extraction. API keys are only needed for search queries and Level 3 AI enrichment.

---

## 📖 Usage

### Mode 1: Search Query
1. Select **"Search Query"** mode
2. Enter a query like `"fintech startups in San Francisco"`
3. Choose your extraction depth (Basic, Enhanced, or Comprehensive)
4. Click **"Search & Scrape"**
5. The tool will find companies via Google, then scrape each one

### Mode 2: Seed URLs
1. Select **"Seed URLs"** mode
2. Enter company URLs (one per line):
   ```
   https://stripe.com
   https://notion.so
   https://vercel.com
   ```
3. Choose extraction depth and click **"Start Scraping"**

### Exporting Results
- Click **"JSON"** or **"CSV"** buttons to download results
- Click **"Copy"** to copy JSON to clipboard

---

## 🔧 Technical Design Decisions

### Why Next.js?
Since this is a **Full Stack Engineer** assignment, I chose Next.js to demonstrate both frontend and backend skills in a single codebase. The API routes handle scraping logic server-side, while the React frontend provides a polished user experience.

### Why Cheerio over Puppeteer/Selenium?
- **Cheerio** is significantly faster and lighter than headless browsers
- It requires zero system dependencies (no Chrome installation)
- Most company homepages serve essential content in initial HTML
- For production use with JS-heavy SPAs, Puppeteer would be integrated as a fallback

### Why Server-side Scraping?
Scraping runs on the server (via API routes) to:
- Avoid CORS issues that prevent client-side fetching
- Keep API keys secure
- Enable rate limiting and request management

### Data Extraction Strategy
The extractor uses a **multi-signal approach** for reliability:
- **Company Name**: `og:site_name` → Schema.org → `<title>` → `<h1>` → domain
- **Emails**: Regex with blacklist filtering to exclude false positives
- **Phones**: `tel:` links + regex patterns for US/international formats
- **Social Profiles**: Link href matching against known platform URL patterns
- **Tech Stack**: Pattern matching against 40+ technology signatures in HTML
- **AI Enrichment**: Stripped page text sent to Gemini for structured analysis

### Rate Limiting
Requests are spaced 1.5s apart with random jitter (0-500ms) to:
- Respect target servers
- Avoid IP blocking
- Mimic human browsing patterns

---

## 📁 Project Structure

```
scrape-intel/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with SEO metadata
│   │   ├── page.tsx                # Main dashboard (React client component)
│   │   ├── globals.css             # Design system (dark theme, 600+ lines)
│   │   └── api/
│   │       ├── search/route.ts     # Search query → URL discovery
│   │       ├── scrape/route.ts     # URL → company data extraction
│   │       └── export/route.ts     # Results → CSV/JSON download
│   ├── lib/
│   │   ├── types.ts                # TypeScript interfaces & types
│   │   ├── scraper.ts              # HTML fetching with UA rotation
│   │   ├── extractor.ts            # Data extraction (emails, phones, etc.)
│   │   ├── techDetector.ts         # Tech stack detection (40+ patterns)
│   │   ├── aiEnricher.ts           # Gemini AI enrichment
│   │   ├── searchEngine.ts         # Serper.dev Google search
│   │   ├── validator.ts            # URL validation & reachability
│   │   ├── rateLimiter.ts          # Rate limiting with jitter
│   │   └── logger.ts              # Structured logging
│   └── utils/
│       └── csvExport.ts            # JSON → CSV conversion
├── sample-output/
│   ├── sample-results.json         # Sample JSON output
│   └── sample-results.csv          # Sample CSV output
├── .env.example                    # Environment template
├── package.json
├── tsconfig.json
└── README.md                       # This file
```

---

## 📋 Assumptions

1. **Static HTML**: The tool primarily handles server-rendered HTML. For JavaScript-heavy SPAs, a headless browser (Puppeteer) would be needed as a fallback.
2. **Public Data Only**: Only publicly accessible data is extracted. No authentication or login-wall bypassing.
3. **Reasonable Scale**: Designed for up to 20 URLs per request. For larger-scale scraping, a job queue system would be implemented.
4. **AI Accuracy**: AI-extracted fields (competitors, funding, etc.) are inferred and should be verified. The structured prompt guides Gemini to return `null` for uncertain fields.
5. **Rate Limiting**: A 1.5-2s delay between requests. Production systems would need proxy rotation for higher volumes.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| [Next.js 15](https://nextjs.org/) | Full-stack React framework |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe development |
| [Cheerio](https://cheerio.js.org/) | Server-side HTML parsing |
| [Serper.dev API](https://serper.dev/) | Google search for URL discovery |
| [Google Gemini API](https://ai.google.dev/) | AI-powered data enrichment |
| Vanilla CSS | Custom design system |

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

<div align="center">

Built with ❤️ for the Unicraft Tech Full Stack Engineer Assignment

</div>
