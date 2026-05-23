// ============================================================
// ScrapeIntel — Search API Route
// POST /api/search — Discover company URLs from a search query
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { searchCompanies } from "@/lib/searchEngine";
import { Logger } from "@/lib/logger";
import { SearchResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  const logger = new Logger();

  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Search query is required", logs: logger.getLogs() },
        { status: 400 }
      );
    }

    logger.info(`Search request received: "${query.trim()}"`);

    const urls = await searchCompanies(query.trim(), logger);

    const response: SearchResponse = {
      urls,
      logs: logger.getLogs(),
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
