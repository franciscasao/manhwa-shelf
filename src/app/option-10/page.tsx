"use client";

import { useState, useMemo } from "react";
import { Nunito, Quicksand } from "next/font/google";
import { sampleManga } from "@/data/sample";
import { Manga, DownloadStatus } from "@/lib/types";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
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
    case "complete": return "Complete";
    case "partial": return "In Progress";
    case "queued": return "Queued";
    case "not-downloaded": return "Not Downloaded";
  }
}

function statusAccent(status: DownloadStatus): string {
  switch (status) {
    case "complete": return "#4ecdc4";
    case "partial": return "#45b7d1";
    case "queued": return "#f7dc6f";
    case "not-downloaded": return "#a3b1c6";
  }
}

/* Neumorphic circular progress */
function NeuCircularProgress({ percent }: { percent: number }) {
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      {/* Inset track (neumorphic) */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "#e0e5ec",
          boxShadow: "inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff",
          position: "absolute",
          inset: 0,
        }}
      />
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="transparent"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#4ecdc4"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <span
        className={`${quicksand.className} absolute inset-0 flex items-center justify-center`}
        style={{ fontSize: 14, fontWeight: 700, color: "#5a6a7e" }}
      >
        {percent}%
      </span>
    </div>
  );
}

function NeuCard({ manga }: { manga: Manga }) {
  const status = getDownloadStatus(manga);
  const percent = getDownloadPercent(manga);

  return (
    <div className="neu-card" style={{
      background: "#e0e5ec",
      borderRadius: 20,
      padding: 20,
      boxShadow: "8px 8px 16px #a3b1c6, -8px -8px 16px #ffffff",
    }}>
      {/* Circular progress */}
      <NeuCircularProgress percent={percent} />

      {/* Title */}
      <h3 className={nunito.className} style={{
        fontSize: 16,
        fontWeight: 700,
        color: "#3d4f5f",
        textAlign: "center",
        marginTop: 12,
        marginBottom: 4,
        lineHeight: 1.3,
      }}>
        {manga.title}
      </h3>

      {/* Author */}
      <p className={quicksand.className} style={{
        fontSize: 12,
        color: "#8a99a9",
        textAlign: "center",
        marginBottom: 12,
        fontWeight: 500,
      }}>
        {manga.author}
      </p>

      {/* Status pill */}
      <div className="flex justify-center mb-3">
        <span
          className={quicksand.className}
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 14px",
            borderRadius: 9999,
            color: statusAccent(status),
            background: "#e0e5ec",
            boxShadow: "inset 2px 2px 4px #a3b1c6, inset -2px -2px 4px #ffffff",
          }}
        >
          {statusLabel(status)}
        </span>
      </div>

      {/* Stats row (neumorphic inset containers) */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div style={{
          background: "#e0e5ec",
          borderRadius: 12,
          padding: "8px 10px",
          boxShadow: "inset 3px 3px 6px #a3b1c6, inset -3px -3px 6px #ffffff",
          textAlign: "center",
        }}>
          <p className={quicksand.className} style={{ fontSize: 10, color: "#8a99a9", fontWeight: 500, marginBottom: 2 }}>
            Chapters
          </p>
          <p className={nunito.className} style={{ fontSize: 14, color: "#3d4f5f", fontWeight: 700 }}>
            {manga.chapters.downloaded}
            <span style={{ color: "#a3b1c6", fontWeight: 500 }}>/{manga.chapters.total ?? "??"}</span>
          </p>
        </div>
        <div style={{
          background: "#e0e5ec",
          borderRadius: 12,
          padding: "8px 10px",
          boxShadow: "inset 3px 3px 6px #a3b1c6, inset -3px -3px 6px #ffffff",
          textAlign: "center",
        }}>
          <p className={quicksand.className} style={{ fontSize: 10, color: "#8a99a9", fontWeight: 500, marginBottom: 2 }}>
            Size
          </p>
          <p className={nunito.className} style={{ fontSize: 14, color: "#3d4f5f", fontWeight: 700 }}>
            {manga.sizeOnDisk}
          </p>
        </div>
      </div>

      {/* Genres */}
      <div className="flex flex-wrap justify-center gap-1.5 mb-3">
        {manga.genres.map((genre) => (
          <span
            key={genre}
            className={quicksand.className}
            style={{
              fontSize: 10,
              padding: "3px 10px",
              borderRadius: 9999,
              color: "#6b7b8d",
              background: "#e0e5ec",
              boxShadow: "2px 2px 4px #a3b1c6, -2px -2px 4px #ffffff",
              fontWeight: 500,
            }}
          >
            {genre}
          </span>
        ))}
      </div>

      {/* Footer: rating + date */}
      <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
        <div className="flex items-center gap-1">
          <span style={{ color: "#f7dc6f", fontSize: 13 }}>{"\u2605"}</span>
          <span className={quicksand.className} style={{ fontSize: 13, color: "#5a6a7e", fontWeight: 600 }}>
            {manga.rating}
          </span>
        </div>
        {manga.lastUpdated && (
          <span className={quicksand.className} style={{ fontSize: 10, color: "#a3b1c6", fontWeight: 500 }}>
            {manga.lastUpdated}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Option10Page() {
  const [filter, setFilter] = useState<DownloadStatus | "all">("all");

  const filtered =
    filter === "all"
      ? sampleManga
      : sampleManga.filter((m) => getDownloadStatus(m) === filter);

  const stats = useMemo(() => {
    const totalTitles = sampleManga.length;
    const chaptersDownloaded = sampleManga.reduce(
      (sum, m) => sum + m.chapters.downloaded,
      0
    );
    const storageUsedGB = sampleManga.reduce((sum, m) => {
      const match = m.sizeOnDisk.match(/([\d.]+)\s*(GB|MB)/i);
      if (!match) return sum;
      const val = parseFloat(match[1]);
      if (match[2].toUpperCase() === "MB") return sum + val / 1024;
      return sum + val;
    }, 0);
    return {
      totalTitles,
      chaptersDownloaded,
      storageUsed: storageUsedGB.toFixed(1) + " GB",
    };
  }, []);

  const filterOptions: { label: string; value: DownloadStatus | "all" }[] = [
    { label: "All", value: "all" },
    { label: "Complete", value: "complete" },
    { label: "In Progress", value: "partial" },
    { label: "Not Downloaded", value: "not-downloaded" },
  ];

  return (
    <div
      className={`${nunito.variable} ${quicksand.variable} min-h-screen`}
      style={{ backgroundColor: "#e0e5ec", fontFamily: "var(--font-quicksand)" }}
    >
      <style>{`
        .neu-card {
          transition: all 0.2s ease;
        }
        .neu-card:hover {
          transform: scale(1.01);
          box-shadow: 10px 10px 20px #a3b1c6, -10px -10px 20px #ffffff !important;
        }
        .neu-toggle {
          transition: all 0.15s ease;
          cursor: pointer;
        }
        .neu-toggle:hover {
          box-shadow: 4px 4px 8px #a3b1c6, -4px -4px 8px #ffffff !important;
        }
      `}</style>

      {/* Header */}
      <header style={{ padding: "32px 0 24px" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className={nunito.className} style={{ fontSize: 28, fontWeight: 800, color: "#3d4f5f" }}>
            Manhwa Shelf
          </h1>
          <p className={quicksand.className} style={{ fontSize: 14, color: "#8a99a9", marginTop: 4, fontWeight: 500 }}>
            Download manager
          </p>
        </div>
      </header>

      {/* Stat bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Titles", value: stats.totalTitles },
            { label: "Chapters", value: stats.chaptersDownloaded.toLocaleString() },
            { label: "Storage", value: stats.storageUsed },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "#e0e5ec",
                borderRadius: 16,
                padding: "16px 20px",
                boxShadow: "inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff",
              }}
            >
              <p className={quicksand.className} style={{ fontSize: 11, color: "#8a99a9", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                {stat.label}
              </p>
              <p className={nunito.className} style={{ fontSize: 28, fontWeight: 800, color: "#3d4f5f" }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters (neumorphic toggle pills) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-wrap gap-3">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`${quicksand.className} neu-toggle`}
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 20px",
                borderRadius: 9999,
                border: "none",
                background: "#e0e5ec",
                color: filter === opt.value ? "#4ecdc4" : "#8a99a9",
                boxShadow:
                  filter === opt.value
                    ? "inset 3px 3px 6px #a3b1c6, inset -3px -3px 6px #ffffff"
                    : "3px 3px 6px #a3b1c6, -3px -3px 6px #ffffff",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((manga) => (
            <NeuCard key={manga.id} manga={manga} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className={nunito.className} style={{ fontSize: 18, fontWeight: 700, color: "#5a6a7e" }}>
              No titles found
            </p>
            <p className={quicksand.className} style={{ fontSize: 14, color: "#a3b1c6", marginTop: 4 }}>
              Try a different filter
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ padding: "16px 0 24px" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <p className={quicksand.className} style={{ fontSize: 12, color: "#a3b1c6", fontWeight: 500 }}>
            Neumorphic Soft UI
          </p>
          <p className={quicksand.className} style={{ fontSize: 12, color: "#c8cfd8" }}>
            Manhwa Shelf
          </p>
        </div>
      </footer>
    </div>
  );
}
