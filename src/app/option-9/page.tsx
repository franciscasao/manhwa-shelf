"use client";

import { useMemo } from "react";
import { Playfair_Display, Source_Serif_4 } from "next/font/google";
import { sampleManga } from "@/data/sample";
import { Manga, DownloadStatus } from "@/lib/types";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-source-serif",
});

function getDownloadStatus(manga: Manga): DownloadStatus {
  if (manga.chapters.downloaded === 0) return "not-downloaded";
  if (
    manga.chapters.total &&
    manga.chapters.downloaded >= manga.chapters.total
  )
    return "complete";
  return "partial";
}

function statusText(status: DownloadStatus): string {
  switch (status) {
    case "complete": return "Archived";
    case "partial": return "In Collection";
    case "queued": return "Awaiting";
    case "not-downloaded": return "Not Acquired";
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function HeroArticle({ manga }: { manga: Manga }) {
  const status = getDownloadStatus(manga);

  return (
    <div className="newspaper-hero" style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 24,
      paddingBottom: 24,
      borderBottom: "1px solid #000",
      marginBottom: 24,
    }}>
      {/* Cover */}
      <div style={{
        aspectRatio: "3/4",
        backgroundImage: `url(${manga.coverImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        border: "1px solid #ddd",
      }} />

      {/* Article text */}
      <div>
        <p className={sourceSerif.className} style={{ fontSize: 11, color: "#1a3a5c", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
          {statusText(status)} &middot; {manga.genres.join(", ")}
        </p>
        <h2 className={playfair.className} style={{ fontSize: 32, fontWeight: 800, color: "#000", lineHeight: 1.15, marginBottom: 8 }}>
          {manga.title}
        </h2>
        <p className={sourceSerif.className} style={{ fontSize: 14, color: "#555", fontStyle: "italic", marginBottom: 12 }}>
          By {manga.author}
        </p>
        <p className={sourceSerif.className} style={{ fontSize: 15, color: "#333", lineHeight: 1.7, marginBottom: 12 }}>
          <span style={{ fontSize: 32, fontWeight: 700, float: "left", lineHeight: 0.8, marginRight: 6, marginTop: 4, color: "#1a3a5c" }}>
            {manga.chapters.downloaded.toLocaleString()}
          </span>
          chapters downloaded of {manga.chapters.total?.toLocaleString() ?? "an ongoing series"}.
          Currently occupying {manga.sizeOnDisk} of disk space. Rated {manga.rating} out of 10 by readers.
        </p>
        <p className={sourceSerif.className} style={{ fontSize: 13, color: "#888", borderTop: "1px solid #ddd", paddingTop: 8 }}>
          {manga.chapters.downloaded}/{manga.chapters.total ?? "??"} ch
          {manga.lastUpdated && <span> &middot; Last updated {formatDate(manga.lastUpdated)}</span>}
        </p>
      </div>
    </div>
  );
}

function ArticleSnippet({ manga }: { manga: Manga }) {
  const status = getDownloadStatus(manga);

  return (
    <div className="newspaper-article" style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #e0e0e0" }}>
      <div className="flex gap-3">
        {/* Small thumbnail */}
        <div style={{
          width: 60,
          height: 80,
          flexShrink: 0,
          backgroundImage: `url(${manga.coverImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: "1px solid #ddd",
        }} />

        <div className="flex-1 min-w-0">
          <h3 className={playfair.className} style={{ fontSize: 18, fontWeight: 700, color: "#000", lineHeight: 1.2, marginBottom: 2 }}>
            {manga.title}
          </h3>
          <p className={sourceSerif.className} style={{ fontSize: 12, color: "#666", fontStyle: "italic", marginBottom: 4 }}>
            By {manga.author} &middot; {manga.genres.slice(0, 2).join(", ")}
          </p>
          <p className={sourceSerif.className} style={{ fontSize: 13, color: "#444", lineHeight: 1.5, marginBottom: 4 }}>
            {statusText(status)}. {manga.chapters.downloaded}/{manga.chapters.total ?? "??"} chapters collected.
            {manga.sizeOnDisk !== "0 MB" && ` ${manga.sizeOnDisk} on disk.`}
          </p>
          <div className="flex items-center gap-3">
            <span className={sourceSerif.className} style={{
              fontSize: 12,
              color: "#1a3a5c",
              fontWeight: 600,
              borderBottom: "1px solid #1a3a5c",
              display: "inline-block",
            }}>
              {manga.chapters.downloaded}/{manga.chapters.total ?? "??"}
            </span>
            <span className={sourceSerif.className} style={{ fontSize: 11, color: "#999" }}>
              {"\u2605"} {manga.rating}
            </span>
            {manga.lastUpdated && (
              <span className={sourceSerif.className} style={{ fontSize: 11, color: "#aaa" }}>
                {formatDate(manga.lastUpdated)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Option9Page() {
  const hero = sampleManga[0];
  const rest = sampleManga.slice(1);

  const totalChapters = sampleManga.reduce(
    (acc, m) => acc + m.chapters.downloaded,
    0
  );

  const midpoint = Math.ceil(rest.length / 2);
  const leftCol = rest.slice(0, midpoint);
  const rightCol = rest.slice(midpoint);

  return (
    <div
      className={`${playfair.variable} ${sourceSerif.variable} min-h-screen`}
      style={{ backgroundColor: "#ffffff", fontFamily: "var(--font-source-serif)" }}
    >
      <style>{`
        .newspaper-article {
          transition: background-color 0.15s ease;
        }
        .newspaper-article:hover {
          background-color: #fafafa;
        }
        .newspaper-hero {
          transition: background-color 0.15s ease;
        }
        .newspaper-hero:hover {
          background-color: #fafafa;
        }
        @media (max-width: 768px) {
          .newspaper-hero {
            grid-template-columns: 1fr !important;
          }
          .newspaper-columns {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Masthead */}
      <header className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
        {/* Top rule */}
        <div style={{ borderTop: "3px double #000", paddingTop: 8, marginBottom: 4 }}>
          <div className="flex items-center justify-between">
            <span className={sourceSerif.className} style={{ fontSize: 11, color: "#888", fontStyle: "italic" }}>
              Vol. 1, No. 8
            </span>
            <span className={sourceSerif.className} style={{ fontSize: 11, color: "#888" }}>
              Feb 22, 2026 — Seoul
            </span>
          </div>
        </div>

        {/* Title */}
        <div style={{ borderTop: "1px solid #000", borderBottom: "3px double #000", padding: "16px 0", textAlign: "center" }}>
          <h1 className={playfair.className} style={{ fontSize: "clamp(36px, 7vw, 64px)", fontWeight: 900, color: "#000", letterSpacing: "-0.02em", lineHeight: 1 }}>
            The Manhwa Shelf
          </h1>
          <p className={sourceSerif.className} style={{ fontSize: 13, color: "#666", marginTop: 8, fontStyle: "italic" }}>
            A Complete Record of Digital Collections &middot; {totalChapters.toLocaleString()} Chapters Archived
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Section header */}
        <div style={{ marginBottom: 16 }}>
          <p className={sourceSerif.className} style={{ fontSize: 12, color: "#1a3a5c", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 700, marginRight: 4, color: "#1a3a5c" }}>F</span>eatured Collection
          </p>
        </div>

        {/* Hero / Above the fold */}
        <HeroArticle manga={hero} />

        {/* Below the fold: multi-column */}
        <div style={{ marginBottom: 8 }}>
          <p className={sourceSerif.className} style={{ fontSize: 12, color: "#1a3a5c", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600 }}>
            <span style={{ fontSize: 18, fontWeight: 700, marginRight: 4, color: "#1a3a5c" }}>C</span>omplete Listings
          </p>
        </div>

        <div
          className="newspaper-columns"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1px 1fr",
            gap: 24,
          }}
        >
          {/* Left column */}
          <div>
            {leftCol.map((manga) => (
              <ArticleSnippet key={manga.id} manga={manga} />
            ))}
          </div>

          {/* Column rule */}
          <div style={{ backgroundColor: "#ddd" }} />

          {/* Right column */}
          <div>
            {rightCol.map((manga) => (
              <ArticleSnippet key={manga.id} manga={manga} />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "3px double #000", padding: "16px 0", marginTop: 24 }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 flex items-center justify-between">
          <p className={sourceSerif.className} style={{ fontSize: 11, color: "#999", fontStyle: "italic" }}>
            Newspaper Broadsheet UI
          </p>
          <p className={sourceSerif.className} style={{ fontSize: 11, color: "#ccc" }}>
            The Manhwa Shelf
          </p>
        </div>
      </footer>
    </div>
  );
}
