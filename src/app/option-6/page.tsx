"use client";

import { useState } from "react";
import { Press_Start_2P } from "next/font/google";
import { sampleManga } from "@/data/sample";
import { Manga, DownloadStatus } from "@/lib/types";

const pixel = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel",
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

function getDownloadPercent(manga: Manga): number {
  if (manga.chapters.downloaded === 0) return 0;
  if (!manga.chapters.total) return 65;
  return Math.round(
    (manga.chapters.downloaded / manga.chapters.total) * 100
  );
}

function HealthBar({ manga }: { manga: Manga }) {
  const percent = getDownloadPercent(manga);
  const totalSquares = 10;
  const filledSquares = Math.round((percent / 100) * totalSquares);
  const status = getDownloadStatus(manga);

  const fillColor =
    status === "complete"
      ? "#00ff00"
      : status === "not-downloaded"
        ? "#ff4444"
        : "#ffd700";

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalSquares }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 12,
            height: 12,
            border: "2px solid",
            borderColor: i < filledSquares ? fillColor : "#444",
            backgroundColor: i < filledSquares ? fillColor : "transparent",
          }}
        />
      ))}
    </div>
  );
}

function PixelStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating / 2);
  const hasHalf = rating % 2 >= 1;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          style={{
            color: i < fullStars ? "#ffd700" : i === fullStars && hasHalf ? "#ffd700" : "#444",
            fontSize: "10px",
            fontFamily: "var(--font-pixel)",
          }}
        >
          {i < fullStars || (i === fullStars && hasHalf) ? "\u2605" : "\u2606"}
        </span>
      ))}
    </div>
  );
}

function ItemSlot({ manga }: { manga: Manga }) {
  const status = getDownloadStatus(manga);
  const statusColor =
    status === "complete"
      ? "#00ff00"
      : status === "not-downloaded"
        ? "#ff4444"
        : "#ffd700";
  const statusLabel =
    status === "complete"
      ? "COMPLETE"
      : status === "not-downloaded"
        ? "EMPTY"
        : "LOADING...";

  return (
    <div className="pixel-card relative" style={{
      border: "2px dotted #00ff00",
      backgroundColor: "#16213e",
      padding: "12px",
    }}>
      {/* Pixel corner decorations */}
      <div style={{ position: "absolute", top: 0, left: 0, width: 6, height: 6, backgroundColor: "#ffd700" }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: 6, height: 6, backgroundColor: "#ffd700" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, width: 6, height: 6, backgroundColor: "#ffd700" }} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: 6, height: 6, backgroundColor: "#ffd700" }} />

      {/* Cover */}
      <div
        style={{
          width: "100%",
          aspectRatio: "3/4",
          backgroundImage: `url(${manga.coverImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: "2px solid #00ff00",
          imageRendering: "pixelated",
          marginBottom: 8,
        }}
      />

      {/* Status */}
      <div className={`${pixel.className} mb-2`} style={{ fontSize: "7px", color: statusColor }}>
        [{statusLabel}]
      </div>

      {/* Title */}
      <h3 className={`${pixel.className} mb-1 leading-relaxed`} style={{ fontSize: "9px", color: "#fff", lineHeight: 1.6 }}>
        {manga.title}
      </h3>

      {/* Author */}
      <p className={`${pixel.className}`} style={{ fontSize: "7px", color: "#888", marginBottom: 8 }}>
        BY {manga.author.toUpperCase()}
      </p>

      {/* RPG Stats */}
      <div className={`${pixel.className} mb-2`} style={{ fontSize: "7px", color: "#00ff00", lineHeight: 2 }}>
        <div>ATK: {manga.rating} | LVL: {manga.chapters.downloaded}/{manga.chapters.total ?? "??"}</div>
      </div>

      {/* Health Bar */}
      <HealthBar manga={manga} />

      {/* Star rating */}
      <div className="mt-2">
        <PixelStars rating={manga.rating} />
      </div>

      {/* Footer */}
      <div className={`${pixel.className} mt-2 flex items-center justify-between`} style={{ fontSize: "6px", color: "#666" }}>
        <span>{manga.sizeOnDisk}</span>
        {manga.lastUpdated && <span>{manga.lastUpdated}</span>}
      </div>
    </div>
  );
}

export default function Option6Page() {
  const [filter, setFilter] = useState<DownloadStatus | "all">("all");

  const filtered =
    filter === "all"
      ? sampleManga
      : sampleManga.filter((m) => getDownloadStatus(m) === filter);

  const totalChapters = sampleManga.reduce(
    (acc, m) => acc + m.chapters.downloaded,
    0
  );
  const totalPossible = sampleManga.reduce(
    (acc, m) => acc + (m.chapters.total ?? m.chapters.downloaded),
    0
  );
  const xpPercent = totalPossible > 0 ? Math.round((totalChapters / totalPossible) * 100) : 0;

  const filterOptions: { label: string; value: DownloadStatus | "all" }[] = [
    { label: "ALL", value: "all" },
    { label: "COMPLETE", value: "complete" },
    { label: "PARTIAL", value: "partial" },
    { label: "EMPTY", value: "not-downloaded" },
  ];

  return (
    <div
      className={`${pixel.variable} min-h-screen`}
      style={{ backgroundColor: "#1a1a2e", fontFamily: "var(--font-pixel)" }}
    >
      <style>{`
        .pixel-card {
          transition: none;
        }
        .pixel-card:hover {
          animation: blink-border 0.5s step-end infinite;
        }
        @keyframes blink-border {
          0%, 100% { border-color: #00ff00; }
          50% { border-color: #ffd700; }
        }
        .pixel-btn:hover {
          background-color: #00ff00 !important;
          color: #1a1a2e !important;
        }
      `}</style>

      {/* Header */}
      <header style={{ borderBottom: "4px solid #00ff00", padding: "24px 0" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className={`${pixel.className} mb-4`} style={{ fontSize: "8px", color: "#ffd700", letterSpacing: "0.2em" }}>
            &gt;&gt; MANHWA SHELF v1.0 &lt;&lt;
          </p>
          <h1 className={`${pixel.className}`} style={{ fontSize: "24px", color: "#00ff00", lineHeight: 1.5 }}>
            INVENTORY
          </h1>
          <p className={`${pixel.className} mt-2`} style={{ fontSize: "8px", color: "#888" }}>
            {sampleManga.length} ITEMS COLLECTED | {totalChapters.toLocaleString()} CHAPTERS ARCHIVED
          </p>

          {/* XP Bar */}
          <div className="mt-4" style={{ maxWidth: 400 }}>
            <div className="flex items-center justify-between mb-1">
              <span className={`${pixel.className}`} style={{ fontSize: "7px", color: "#ffd700" }}>
                XP: {totalChapters}/{totalPossible}
              </span>
              <span className={`${pixel.className}`} style={{ fontSize: "7px", color: "#ffd700" }}>
                {xpPercent}%
              </span>
            </div>
            <div style={{ height: 16, border: "2px solid #ffd700", backgroundColor: "#0f0f1a" }}>
              <div
                style={{
                  height: "100%",
                  width: `${xpPercent}%`,
                  backgroundColor: "#ffd700",
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2 mb-6">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`${pixel.className} pixel-btn`}
              style={{
                fontSize: "7px",
                padding: "8px 12px",
                border: "2px solid #00ff00",
                backgroundColor: filter === opt.value ? "#00ff00" : "transparent",
                color: filter === opt.value ? "#1a1a2e" : "#00ff00",
                cursor: "pointer",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((manga) => (
            <ItemSlot key={manga.id} manga={manga} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className={`${pixel.className}`} style={{ fontSize: "10px", color: "#ff4444" }}>
              NO ITEMS FOUND
            </p>
            <p className={`${pixel.className} mt-2`} style={{ fontSize: "7px", color: "#666" }}>
              TRY ANOTHER FILTER
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "2px solid #00ff00", padding: "16px 0" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <p className={`${pixel.className}`} style={{ fontSize: "6px", color: "#00ff00" }}>
            RETRO PIXEL UI
          </p>
          <p className={`${pixel.className}`} style={{ fontSize: "6px", color: "#444" }}>
            PRESS START
          </p>
        </div>
      </footer>
    </div>
  );
}
