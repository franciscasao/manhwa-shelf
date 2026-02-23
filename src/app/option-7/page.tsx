"use client";

import { useState } from "react";
import { Orbitron, Rajdhani } from "next/font/google";
import { sampleManga } from "@/data/sample";
import { Manga, DownloadStatus } from "@/lib/types";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-orbitron",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani",
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
  if (!manga.chapters.total) return 75;
  return Math.round(
    (manga.chapters.downloaded / manga.chapters.total) * 100
  );
}

function statusLabel(status: DownloadStatus): string {
  switch (status) {
    case "complete": return "SYNCED";
    case "partial": return "SYNCING";
    case "queued": return "QUEUED";
    case "not-downloaded": return "OFFLINE";
  }
}

function statusColor(status: DownloadStatus): string {
  switch (status) {
    case "complete": return "#00ffff";
    case "partial": return "#ff00ff";
    case "queued": return "#ff6b35";
    case "not-downloaded": return "#555";
  }
}

function NeonBar({ percent, status }: { percent: number; status: DownloadStatus }) {
  const glowColor = status === "complete" ? "#00ffff" : "#ff00ff";
  return (
    <div style={{ width: "100%", height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3 }}>
      <div
        style={{
          height: "100%",
          width: `${percent}%`,
          background: "linear-gradient(90deg, #ff00ff, #00ffff)",
          borderRadius: 3,
          boxShadow: `0 0 8px ${glowColor}, 0 0 16px ${glowColor}40`,
          transition: "width 0.5s ease",
        }}
      />
    </div>
  );
}

function MangaCard({ manga }: { manga: Manga }) {
  const status = getDownloadStatus(manga);
  const percent = getDownloadPercent(manga);

  return (
    <div className="vapor-card relative overflow-hidden" style={{
      display: "flex",
      flexDirection: "row",
      gap: 0,
      backgroundColor: "rgba(15,0,36,0.8)",
      border: "1px solid rgba(255,0,255,0.2)",
      borderRadius: 8,
    }}>
      {/* Cover */}
      <div style={{
        width: 120,
        minHeight: 180,
        flexShrink: 0,
        backgroundImage: `url(${manga.coverImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRight: "1px solid rgba(255,0,255,0.15)",
      }} />

      {/* Info */}
      <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          {/* Status */}
          <div className="flex items-center gap-2 mb-2">
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: statusColor(status),
                boxShadow: `0 0 6px ${statusColor(status)}`,
                display: "inline-block",
              }}
            />
            <span className={rajdhani.className} style={{ fontSize: 12, color: statusColor(status), fontWeight: 600, letterSpacing: "0.1em" }}>
              {statusLabel(status)}
            </span>
          </div>

          {/* Title */}
          <h3 className={orbitron.className} style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4, lineHeight: 1.3 }}>
            {manga.title}
          </h3>

          {/* Author */}
          <p className={rajdhani.className} style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
            {manga.author}
          </p>

          {/* Genres */}
          <div className="flex flex-wrap gap-1 mb-3">
            {manga.genres.map((genre) => (
              <span
                key={genre}
                className={rajdhani.className}
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 2,
                  border: "1px solid rgba(255,0,255,0.3)",
                  color: "rgba(255,255,255,0.6)",
                  fontWeight: 500,
                }}
              >
                {genre}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom section */}
        <div>
          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className={rajdhani.className} style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                {manga.chapters.downloaded}/{manga.chapters.total ?? "??"}
              </span>
              <span className={rajdhani.className} style={{ fontSize: 12, color: "#00ffff", fontWeight: 600 }}>
                {percent}%
              </span>
            </div>
            <NeonBar percent={percent} status={status} />
          </div>

          {/* Footer info */}
          <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
            <span className={rajdhani.className} style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              {manga.sizeOnDisk}
            </span>
            <div className="flex items-center gap-1">
              <span style={{ color: "#ffd700", fontSize: 11 }}>{"\u2605"}</span>
              <span className={rajdhani.className} style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
                {manga.rating}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Option7Page() {
  const [filter, setFilter] = useState<DownloadStatus | "all">("all");

  const filtered =
    filter === "all"
      ? sampleManga
      : sampleManga.filter((m) => getDownloadStatus(m) === filter);

  const totalChapters = sampleManga.reduce(
    (acc, m) => acc + m.chapters.downloaded,
    0
  );

  const filterOptions: { label: string; value: DownloadStatus | "all" }[] = [
    { label: "ALL", value: "all" },
    { label: "SYNCED", value: "complete" },
    { label: "SYNCING", value: "partial" },
    { label: "OFFLINE", value: "not-downloaded" },
  ];

  return (
    <div
      className={`${orbitron.variable} ${rajdhani.variable} min-h-screen relative overflow-hidden`}
      style={{ backgroundColor: "#0f0024", fontFamily: "var(--font-rajdhani)" }}
    >
      <style>{`
        .vapor-card {
          transition: all 0.3s ease;
        }
        .vapor-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 0 20px rgba(255,0,255,0.3), 0 0 40px rgba(0,255,255,0.15);
          border-color: rgba(255,0,255,0.5) !important;
        }
        .neon-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, #ff00ff, #00ffff, transparent);
          box-shadow: 0 0 8px rgba(255,0,255,0.5);
        }
        .chrome-text {
          background: linear-gradient(135deg, #ff00ff, #00ffff, #ff00ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .vapor-btn {
          transition: all 0.2s ease;
        }
        .vapor-btn:hover {
          box-shadow: 0 0 12px rgba(255,0,255,0.4);
          border-color: #ff00ff !important;
        }
      `}</style>

      {/* Perspective grid background */}
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}>
        {/* Sunset gradient band */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "40%",
          background: "linear-gradient(180deg, #ff6b35 0%, #ff00ff40 40%, transparent 100%)",
          opacity: 0.15,
        }} />
        {/* Horizontal grid lines (perspective) */}
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.08 }}>
          {Array.from({ length: 20 }).map((_, i) => {
            const y = 50 + i * (50 / 20);
            return (
              <line key={`h-${i}`} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#ff00ff" strokeWidth="1" />
            );
          })}
          {Array.from({ length: 15 }).map((_, i) => {
            const x = 50 + (i - 7) * 8;
            return (
              <line key={`v-${i}`} x1={`${x}%`} y1="50%" x2={`${50 + (i - 7) * 20}%`} y2="100%" stroke="#00ffff" strokeWidth="1" />
            );
          })}
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="mx-auto max-w-5xl px-4 pt-12 pb-8 sm:px-6 lg:px-8">
          <p className={`${rajdhani.className}`} style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", fontWeight: 500, letterSpacing: "0.3em", marginBottom: 8 }}>
            DOWNLOAD MANAGER
          </p>
          <h1 className={`${orbitron.className} chrome-text`} style={{ fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 900, lineHeight: 1.1 }}>
            MANHWA SHELF
          </h1>
          <p className={`${rajdhani.className} mt-3`} style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>
            {totalChapters.toLocaleString()} chapters archived across {sampleManga.length} titles
          </p>
        </header>

        <div className="neon-line mx-auto max-w-5xl" />

        {/* Filters */}
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`${orbitron.className} vapor-btn`}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "6px 16px",
                  border: `1px solid ${filter === opt.value ? "#ff00ff" : "rgba(255,255,255,0.15)"}`,
                  borderRadius: 4,
                  backgroundColor: filter === opt.value ? "rgba(255,0,255,0.15)" : "transparent",
                  color: filter === opt.value ? "#ff00ff" : "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  letterSpacing: "0.1em",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <main className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            {filtered.map((manga) => (
              <MangaCard key={manga.id} manga={manga} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className={`${orbitron.className}`} style={{ fontSize: 14, color: "#ff00ff" }}>
                NO SIGNAL
              </p>
              <p className={`${rajdhani.className} mt-2`} style={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }}>
                No titles match this filter
              </p>
            </div>
          )}
        </main>

        <div className="neon-line mx-auto max-w-5xl" />

        {/* Footer */}
        <footer className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-between">
          <p className={`${rajdhani.className}`} style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontWeight: 500 }}>
            Vaporwave Synthwave UI
          </p>
          <p className={`${orbitron.className}`} style={{ fontSize: 8, color: "rgba(255,0,255,0.3)" }}>
            RETRO FUTURE
          </p>
        </footer>
      </div>
    </div>
  );
}
