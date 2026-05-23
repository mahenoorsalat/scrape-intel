import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScrapeIntel — AI-Powered Company Intelligence Scraper",
  description:
    "Discover companies and extract detailed intelligence including contact info, tech stack, competitors, and more. Powered by AI enrichment.",
  keywords: [
    "web scraping",
    "company intelligence",
    "lead generation",
    "tech stack detection",
    "competitor analysis",
  ],
  authors: [{ name: "ScrapeIntel" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
