// ============================================================
// ScrapeIntel — Export API Route
// POST /api/export — Export results as CSV
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { convertToCSV } from "@/utils/csvExport";
import { CompanyData } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { results, format } = body as {
      results: CompanyData[];
      format: "csv" | "json";
    };

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: "No results to export" },
        { status: 400 }
      );
    }

    if (format === "csv") {
      const csv = convertToCSV(results);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="scrape-intel-results-${Date.now()}.csv"`,
        },
      });
    }

    // JSON format
    const jsonStr = JSON.stringify(results, null, 2);
    return new NextResponse(jsonStr, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="scrape-intel-results-${Date.now()}.json"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
