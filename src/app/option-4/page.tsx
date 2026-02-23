"use client";

import { useState } from "react";
import { Libre_Baskerville, Source_Sans_3 } from "next/font/google";
import { sampleManga } from "@/data/sample";
import { Manga, DownloadStatus } from "@/lib/types";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre-baskerville",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-source-sans",
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

const spineColors = [
  "#C4A882",
  "#A0522D",
  "#8B7355",
  "#D2B48C",
  "#BC8F8F",
  "#CD853F",
  "#B8860B",
  "#A67B5B",
  "#C19A6B",
  "#966F33",
];

const spineTextColors: Record<string, string> = {
  "#C4A882": "#3B2F1E",
  "#A0522D": "#F5F0E8",
  "#8B7355": "#F5F0E8",
  "#D2B48C": "#3B2F1E",
  "#BC8F8F": "#2D1B1B",
  "#CD853F": "#2D1B0E",
  "#B8860B": "#F5F0E8",
  "#A67B5B": "#F5F0E8",
  "#C19A6B": "#2D1B0E",
  "#966F33": "#F5F0E8",
};

function StatusBadge({ status }: { status: DownloadStatus }) {
  if (status === "complete") {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          backgroundColor: "#2D5F3E",
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 6L5 9L10 3"
            stroke="#F5F0E8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  if (status === "partial") {
    return (
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: "2px solid #D4A017",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "50%",
            backgroundColor: "#D4A017",
            opacity: 0.6,
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: "2px solid #8B7355",
        opacity: 0.5,
      }}
    />
  );
}

function BookSpine({
  manga,
  index,
}: {
  manga: Manga;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const status = getDownloadStatus(manga);
  const bgColor = spineColors[index % spineColors.length];
  const textColor = spineTextColors[bgColor] || "#F5F0E8";

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: 80 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover info panel */}
      <div
        className="absolute left-1/2 z-30 pointer-events-none"
        style={{
          bottom: "calc(100% + 14px)",
          transform: "translateX(-50%)",
          opacity: isHovered ? 1 : 0,
          transition: "opacity 0.25s ease",
          width: 220,
        }}
      >
        <div
          className="rounded-lg overflow-hidden"
          style={{
            backgroundColor: "#F5F0E8",
            border: "2px solid #8B7355",
            boxShadow: "0 4px 16px rgba(80, 50, 20, 0.3)",
          }}
        >
          <div className="relative" style={{ height: 120 }}>
            <img
              src={manga.coverImage}
              alt={manga.title}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute top-2 right-2"
              style={{
                backgroundColor: "rgba(245, 240, 232, 0.9)",
                borderRadius: "50%",
                padding: 3,
              }}
            >
              <StatusBadge status={status} />
            </div>
          </div>
          <div className="p-3" style={{ color: "#3B2F1E" }}>
            <p
              className={`${libreBaskerville.className} font-bold text-sm leading-tight`}
            >
              {manga.title}
            </p>
            <p
              className={`${sourceSans.className} text-xs mt-1`}
              style={{ color: "#8B7355" }}
            >
              {manga.author}
            </p>
            <div
              className={`${sourceSans.className} text-xs mt-2 flex flex-col gap-0.5`}
              style={{ color: "#5C4A32" }}
            >
              <span>
                Ch. {manga.chapters.downloaded}
                {manga.chapters.total !== null
                  ? ` / ${manga.chapters.total}`
                  : " (ongoing)"}
              </span>
              <span>{manga.sizeOnDisk}</span>
              {manga.rating > 0 && <span>Rating: {manga.rating}/10</span>}
            </div>
          </div>
          {/* tooltip arrow */}
          <div
            className="absolute left-1/2"
            style={{
              bottom: -8,
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "8px solid #8B7355",
            }}
          />
        </div>
      </div>

      {/* The book spine itself */}
      <div
        className="relative cursor-pointer rounded-sm overflow-hidden"
        style={{
          width: 80,
          height: 280,
          backgroundColor: bgColor,
          transform: isHovered ? "translateY(-8px)" : "translateY(0)",
          transition: "transform 0.25s ease, box-shadow 0.25s ease",
          boxShadow: isHovered
            ? "0 8px 20px rgba(60, 40, 10, 0.45), inset -3px 0 6px rgba(0,0,0,0.15)"
            : "inset -3px 0 6px rgba(0,0,0,0.15), inset 3px 0 6px rgba(255,255,255,0.08)",
        }}
      >
        {/* Spine edge highlight (left) */}
        <div
          className="absolute top-0 left-0 h-full"
          style={{
            width: 4,
            background:
              "linear-gradient(to right, rgba(255,255,255,0.2), transparent)",
          }}
        />

        {/* Spine edge shadow (right) */}
        <div
          className="absolute top-0 right-0 h-full"
          style={{
            width: 6,
            background:
              "linear-gradient(to left, rgba(0,0,0,0.18), transparent)",
          }}
        />

        {/* Decorative top and bottom bands */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: 6,
            backgroundColor: "rgba(0,0,0,0.1)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: 6,
            backgroundColor: "rgba(0,0,0,0.1)",
          }}
        />

        {/* Decorative lines */}
        <div
          className="absolute left-2 right-2"
          style={{
            top: 24,
            height: 1,
            backgroundColor: "rgba(0,0,0,0.12)",
          }}
        />
        <div
          className="absolute left-2 right-2"
          style={{
            bottom: 40,
            height: 1,
            backgroundColor: "rgba(0,0,0,0.12)",
          }}
        />

        {/* Vertical title */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            top: 30,
            bottom: 46,
            left: 0,
            right: 0,
          }}
        >
          <p
            className={`${libreBaskerville.className} font-bold text-center leading-tight select-none`}
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              color: textColor,
              fontSize: manga.title.length > 20 ? 11 : 13,
              letterSpacing: "0.03em",
              maxHeight: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textShadow:
                textColor === "#F5F0E8"
                  ? "0 1px 2px rgba(0,0,0,0.3)"
                  : "0 1px 1px rgba(255,255,255,0.2)",
            }}
          >
            {manga.title}
          </p>
        </div>

        {/* Status badge at bottom */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            bottom: 12,
            left: 0,
            right: 0,
          }}
        >
          <StatusBadge status={status} />
        </div>
      </div>
    </div>
  );
}

function ShelfRow({
  label,
  books,
}: {
  label: string;
  books: Manga[];
}) {
  return (
    <div className="w-full">
      {/* Shelf label */}
      <div
        className={`${libreBaskerville.className} mb-3 flex items-center gap-3`}
        style={{ color: "#5C4A32" }}
      >
        <h2 className="text-lg font-bold whitespace-nowrap">{label}</h2>
        <div
          className="flex-1"
          style={{
            height: 2,
            background:
              "linear-gradient(to right, #8B7355, transparent)",
          }}
        />
        <span
          className={`${sourceSans.className} text-sm font-medium`}
          style={{ color: "#8B7355" }}
        >
          {books.length} {books.length === 1 ? "title" : "titles"}
        </span>
      </div>

      {/* Scrollable spine row */}
      <div className="relative">
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          style={{
            paddingTop: 180,
            scrollbarWidth: "thin",
            scrollbarColor: "#8B7355 transparent",
          }}
        >
          {books.length === 0 ? (
            <div
              className={`${sourceSans.className} flex items-center justify-center`}
              style={{
                height: 280,
                width: "100%",
                color: "#8B7355",
                fontSize: 14,
                fontStyle: "italic",
              }}
            >
              This shelf is empty
            </div>
          ) : (
            books.map((manga, i) => (
              <BookSpine key={manga.id} manga={manga} index={i} />
            ))
          )}
        </div>

        {/* Wooden plank / shelf surface */}
        <div
          className="w-full rounded-sm"
          style={{
            height: 18,
            background:
              "linear-gradient(180deg, #A08060 0%, #8B7355 30%, #7A6548 60%, #6B5840 100%)",
            boxShadow:
              "0 4px 8px rgba(60, 40, 10, 0.35), inset 0 2px 2px rgba(255,255,255,0.12), inset 0 -1px 2px rgba(0,0,0,0.2)",
          }}
        >
          {/* Wood grain lines */}
          <div
            className="w-full h-full rounded-sm"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.04) 40px, rgba(0,0,0,0.04) 42px, transparent 42px, transparent 80px)",
            }}
          />
        </div>
        {/* Shelf bracket shadow */}
        <div
          style={{
            height: 6,
            background:
              "linear-gradient(180deg, rgba(60,40,10,0.15), transparent)",
          }}
        />
      </div>
    </div>
  );
}

export default function Option4Page() {
  const downloaded = sampleManga.filter(
    (m) => getDownloadStatus(m) !== "not-downloaded"
  );
  const notDownloaded = sampleManga.filter(
    (m) => getDownloadStatus(m) === "not-downloaded"
  );

  return (
    <div
      className={`${libreBaskerville.variable} ${sourceSans.variable} relative min-h-screen`}
      style={{ backgroundColor: "#F5F0E8" }}
    >
      {/* Paper / grain texture overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          opacity: 0.4,
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(139, 115, 85, 0.015) 2px,
              rgba(139, 115, 85, 0.015) 4px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 3px,
              rgba(139, 115, 85, 0.012) 3px,
              rgba(139, 115, 85, 0.012) 5px
            ),
            radial-gradient(
              ellipse at 20% 50%,
              rgba(180, 150, 100, 0.06),
              transparent 50%
            ),
            radial-gradient(
              ellipse at 80% 30%,
              rgba(160, 130, 80, 0.05),
              transparent 50%
            )
          `,
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-10 text-center">
          <h1
            className={`${libreBaskerville.className} text-3xl sm:text-4xl font-bold`}
            style={{ color: "#3B2F1E" }}
          >
            Manhwa Shelf
          </h1>
          <p
            className={`${sourceSans.className} mt-2 text-base`}
            style={{ color: "#8B7355" }}
          >
            Your personal collection — {sampleManga.length} titles
          </p>
          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <div
              style={{
                width: 60,
                height: 1,
                background:
                  "linear-gradient(to right, transparent, #8B7355)",
              }}
            />
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                border: "2px solid #8B7355",
              }}
            />
            <div
              style={{
                width: 60,
                height: 1,
                background:
                  "linear-gradient(to left, transparent, #8B7355)",
              }}
            />
          </div>
        </header>

        {/* Legend */}
        <div
          className={`${sourceSans.className} flex flex-wrap items-center justify-center gap-5 mb-10 text-sm`}
          style={{ color: "#5C4A32" }}
        >
          <div className="flex items-center gap-2">
            <StatusBadge status="complete" />
            <span>Complete</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status="partial" />
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status="not-downloaded" />
            <span>Not Downloaded</span>
          </div>
        </div>

        {/* Shelves */}
        <div className="flex flex-col gap-6">
          <ShelfRow label="Downloaded" books={downloaded} />
          <ShelfRow label="Not Yet Downloaded" books={notDownloaded} />
        </div>

        {/* Footer */}
        <footer
          className={`${sourceSans.className} mt-12 text-center text-xs`}
          style={{ color: "#A89880" }}
        >
          Hover over a spine to peek inside
        </footer>
      </div>
    </div>
  );
}
