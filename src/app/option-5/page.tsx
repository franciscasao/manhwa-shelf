"use client";

import { useMemo } from "react";
import { Sora, DM_Sans } from "next/font/google";
import { sampleManga } from "@/data/sample";
import { Manga, DownloadStatus } from "@/lib/types";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600"],
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
  if (manga.chapters.total === null || manga.chapters.total === 0) {
    return manga.chapters.downloaded > 0 ? 75 : 0;
  }
  return Math.round(
    (manga.chapters.downloaded / manga.chapters.total) * 100
  );
}

function statusColor(status: DownloadStatus): string {
  switch (status) {
    case "complete":
      return "#00e5a0";
    case "partial":
      return "#a78bfa";
    case "queued":
      return "#facc15";
    case "not-downloaded":
      return "#64748b";
  }
}

function statusLabel(status: DownloadStatus): string {
  switch (status) {
    case "complete":
      return "Complete";
    case "partial":
      return "Downloading";
    case "queued":
      return "Queued";
    case "not-downloaded":
      return "Not Downloaded";
  }
}

/* Tiny decorative sparkline bars */
function Sparkline({ seed }: { seed: number }) {
  const heights = [35, 60, 45, 80, 55, 70];
  // Rotate the bar pattern based on seed for variety
  const offset = seed % heights.length;
  return (
    <div className="flex items-end gap-[3px] h-5">
      {heights.map((h, i) => {
        const idx = (i + offset) % heights.length;
        return (
          <div
            key={i}
            className="w-[4px] rounded-full"
            style={{
              height: `${heights[idx]}%`,
              background:
                "linear-gradient(to top, rgba(167,139,250,0.6), rgba(0,229,160,0.6))",
            }}
          />
        );
      })}
    </div>
  );
}

/* SVG progress ring */
function ProgressRing({
  percent,
  coverImage,
  title,
}: {
  percent: number;
  coverImage: string;
  title: string;
}) {
  const size = 80;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const gradientId = `ring-grad-${title.replace(/\s+/g, "-")}`;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#00e5a0" />
          </linearGradient>
        </defs>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out progress-ring-circle"
        />
      </svg>
      {/* Cover thumbnail clipped to circle */}
      <div
        className="absolute rounded-full overflow-hidden"
        style={{
          top: strokeWidth + 2,
          left: strokeWidth + 2,
          width: size - (strokeWidth + 2) * 2,
          height: size - (strokeWidth + 2) * 2,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImage}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      {/* Percentage label */}
      <span
        className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-white drop-shadow-md pointer-events-none"
        style={{ fontFamily: "var(--font-dm-sans)" }}
      >
        {percent}%
      </span>
    </div>
  );
}

export default function Option5Page() {
  const data = sampleManga;

  const stats = useMemo(() => {
    const totalTitles = data.length;
    const chaptersDownloaded = data.reduce(
      (sum, m) => sum + m.chapters.downloaded,
      0
    );
    // Parse sizes like "2.4 GB", "0.5 GB", "0 MB"
    const storageUsedGB = data.reduce((sum, m) => {
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
  }, [data]);

  return (
    <div
      className={`${sora.variable} ${dmSans.variable} relative min-h-screen overflow-x-hidden`}
      style={{ fontFamily: "var(--font-dm-sans)" }}
    >
      {/* Inline keyframe styles for the animated gradient mesh */}
      <style>{`
        @keyframes meshShift {
          0%   { background-position: 0% 50%; }
          25%  { background-position: 100% 0%; }
          50%  { background-position: 100% 100%; }
          75%  { background-position: 0% 100%; }
          100% { background-position: 0% 50%; }
        }
        .animated-mesh-bg {
          background: linear-gradient(
            135deg,
            #1a0533 0%,
            #0d1b2a 30%,
            #0a2e36 50%,
            #0d1b2a 70%,
            #1a0533 100%
          );
          background-size: 400% 400%;
          animation: meshShift 20s ease infinite;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          transition: all 0.3s ease;
        }
        .glass-card:hover {
          background: rgba(255, 255, 255, 0.13);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          transform: scale(1.02);
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow: 0 0 30px rgba(167, 139, 250, 0.15), 0 0 60px rgba(0, 229, 160, 0.08);
        }
        .glass-card:hover .progress-ring-circle {
          filter: drop-shadow(0 0 6px rgba(167, 139, 250, 0.6)) drop-shadow(0 0 12px rgba(0, 229, 160, 0.4));
        }
        .stat-card {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(167, 139, 250, 0.12);
        }
      `}</style>

      {/* Background layer */}
      <div className="animated-mesh-bg fixed inset-0 -z-10" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10">
          <h1
            className="text-3xl sm:text-4xl font-bold text-white tracking-tight"
            style={{ fontFamily: "var(--font-sora)" }}
          >
            Manhwa Shelf
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Download manager dashboard
          </p>
        </header>

        {/* Stat Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10">
          {[
            {
              label: "Total Titles",
              value: stats.totalTitles,
              accent: "#a78bfa",
            },
            {
              label: "Chapters Downloaded",
              value: stats.chaptersDownloaded.toLocaleString(),
              accent: "#00e5a0",
            },
            {
              label: "Storage Used",
              value: stats.storageUsed,
              accent: "#38bdf8",
            },
          ].map((stat) => (
            <div key={stat.label} className="stat-card p-6">
              <p
                className="text-4xl sm:text-5xl font-bold text-white mb-1"
                style={{ fontFamily: "var(--font-sora)" }}
              >
                {stat.value}
              </p>
              <p className="text-sm text-white/50 tracking-wide uppercase">
                {stat.label}
              </p>
              <div
                className="mt-4 h-[2px] w-12 rounded-full"
                style={{ background: stat.accent }}
              />
            </div>
          ))}
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-xl font-semibold text-white"
            style={{ fontFamily: "var(--font-sora)" }}
          >
            Library
          </h2>
          <span className="text-xs text-white/40">
            {data.length} titles
          </span>
        </div>

        {/* Manga Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {data.map((manga, idx) => {
            const status = getDownloadStatus(manga);
            const percent = getDownloadPercent(manga);

            return (
              <div key={manga.id} className="glass-card p-5">
                {/* Top section: ring + info */}
                <div className="flex items-start gap-4">
                  <ProgressRing
                    percent={percent}
                    coverImage={manga.coverImage}
                    title={manga.title}
                  />
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-sm font-semibold text-white truncate leading-tight"
                      style={{ fontFamily: "var(--font-sora)" }}
                    >
                      {manga.title}
                    </h3>
                    <p className="text-xs text-white/45 mt-0.5 truncate">
                      {manga.author}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ background: statusColor(status) }}
                      />
                      <span className="text-[11px] text-white/60">
                        {statusLabel(status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details row */}
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-white/40 mb-0.5">Chapters</p>
                    <p className="text-sm font-medium text-white">
                      {manga.chapters.downloaded}
                      <span className="text-white/35">
                        {" / "}
                        {manga.chapters.total ?? "??"}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40 mb-0.5">Size</p>
                    <p className="text-sm font-medium text-white">
                      {manga.sizeOnDisk}
                    </p>
                  </div>
                </div>

                {/* Sparkline + rating row */}
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <Sparkline seed={idx} />
                  <div className="flex items-center gap-1">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="#facc15"
                      className="opacity-80"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span className="text-xs text-white/60 font-medium">
                      {manga.rating}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="mt-16 pb-8 text-center">
          <p className="text-xs text-white/25">
            Glassmorphic Dashboard &middot; Manhwa Shelf
          </p>
        </footer>
      </div>
    </div>
  );
}
