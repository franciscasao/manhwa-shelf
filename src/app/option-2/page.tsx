"use client";

import { useState } from "react";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import Image from "next/image";
import { sampleManga } from "@/data/sample";
import { Manga, DownloadStatus } from "@/lib/types";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-cormorant",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
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
    return manga.chapters.downloaded > 0 ? 100 : 0;
  }
  return Math.min(
    100,
    Math.round((manga.chapters.downloaded / manga.chapters.total) * 100)
  );
}

function statusLabel(status: DownloadStatus): string {
  switch (status) {
    case "complete":
      return "Complete";
    case "partial":
      return "In Progress";
    case "queued":
      return "Queued";
    case "not-downloaded":
      return "Not Downloaded";
  }
}

function HeroCard({ manga }: { manga: Manga }) {
  const status = getDownloadStatus(manga);
  const percent = getDownloadPercent(manga);

  return (
    <section className="mb-16 md:mb-24">
      <div className="flex flex-col md:flex-row gap-0">
        {/* Cover */}
        <div className="relative w-full md:w-[380px] lg:w-[440px] shrink-0 overflow-hidden">
          <div className="aspect-[3/4] md:aspect-auto md:h-[520px] relative">
            <Image
              src={manga.coverImage}
              alt={manga.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 440px"
              unoptimized
            />
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col justify-between py-8 md:py-12 px-6 md:px-16 flex-1 min-w-0">
          <div>
            <p
              className="text-xs tracking-[0.35em] uppercase mb-4"
              style={{
                fontFamily: outfit.style.fontFamily,
                color: "#D14836",
                letterSpacing: "0.35em",
              }}
            >
              Featured &mdash; Most Downloaded
            </p>
            <h2
              className="text-4xl md:text-6xl lg:text-7xl leading-none mb-4"
              style={{
                fontFamily: cormorant.style.fontFamily,
                fontWeight: 700,
                color: "#1A1A1A",
              }}
            >
              {manga.title}
            </h2>
            <p
              className="text-sm tracking-[0.15em] uppercase mb-8"
              style={{
                fontFamily: outfit.style.fontFamily,
                color: "#888",
              }}
            >
              {manga.author}
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {manga.genres.map((genre) => (
                <span
                  key={genre}
                  className="text-[10px] tracking-[0.2em] uppercase px-3 py-1"
                  style={{
                    fontFamily: outfit.style.fontFamily,
                    border: "1px solid #D4D4D0",
                    color: "#666",
                  }}
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>

          <div>
            {/* Large chapter count */}
            <div className="flex items-baseline gap-3 mb-2">
              <span
                className="text-6xl md:text-8xl"
                style={{
                  fontFamily: cormorant.style.fontFamily,
                  fontWeight: 700,
                  color: "#1A1A1A",
                  lineHeight: 1,
                }}
              >
                {manga.chapters.downloaded}
              </span>
              <span
                className="text-lg"
                style={{
                  fontFamily: cormorant.style.fontFamily,
                  fontWeight: 400,
                  color: "#AAA",
                }}
              >
                / {manga.chapters.total ?? "??"} chapters
              </span>
            </div>

            {/* Download bar */}
            <div
              className="w-full h-[2px] mb-4 relative"
              style={{ backgroundColor: "#E8E8E4" }}
            >
              <div
                className="absolute top-0 left-0 h-full transition-all duration-700"
                style={{
                  width: `${percent}%`,
                  backgroundColor: "#D14836",
                }}
              />
            </div>

            <div
              className="flex justify-between items-center text-xs"
              style={{ fontFamily: outfit.style.fontFamily }}
            >
              <span style={{ color: "#D14836" }}>{statusLabel(status)}</span>
              <span style={{ color: "#999" }}>{manga.sizeOnDisk}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ListRow({ manga, index }: { manga: Manga; index: number }) {
  const [hovered, setHovered] = useState(false);
  const status = getDownloadStatus(manga);
  const percent = getDownloadPercent(manga);

  return (
    <div
      className="relative transition-transform duration-200"
      style={{
        transform: hovered ? "translateX(1px)" : "translateX(0)",
        borderBottom: "1px solid #E8E8E4",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-4 md:gap-8 py-5 md:py-6 px-2">
        {/* Index number */}
        <span
          className="hidden md:block text-sm w-8 text-right shrink-0"
          style={{
            fontFamily: cormorant.style.fontFamily,
            fontWeight: 400,
            color: "#CCC",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Small thumbnail */}
        <div className="relative w-10 h-14 md:w-12 md:h-16 shrink-0 overflow-hidden">
          <Image
            src={manga.coverImage}
            alt={manga.title}
            fill
            className="object-cover"
            sizes="48px"
            unoptimized
          />
        </div>

        {/* Title + Author */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-base md:text-lg truncate"
            style={{
              fontFamily: cormorant.style.fontFamily,
              fontWeight: 700,
              color: "#1A1A1A",
            }}
          >
            {manga.title}
          </h3>
          <p
            className="text-[11px] tracking-[0.1em] uppercase truncate"
            style={{
              fontFamily: outfit.style.fontFamily,
              color: "#999",
            }}
          >
            {manga.author}
          </p>
        </div>

        {/* Genres (hidden on small) */}
        <div className="hidden lg:flex gap-2 shrink-0">
          {manga.genres.slice(0, 2).map((genre) => (
            <span
              key={genre}
              className="text-[9px] tracking-[0.15em] uppercase px-2 py-0.5"
              style={{
                fontFamily: outfit.style.fontFamily,
                border: "1px solid #E8E8E4",
                color: "#AAA",
              }}
            >
              {genre}
            </span>
          ))}
        </div>

        {/* Chapter count */}
        <div className="text-right shrink-0 w-20 md:w-28">
          <span
            className="text-xl md:text-2xl"
            style={{
              fontFamily: cormorant.style.fontFamily,
              fontWeight: 700,
              color: "#1A1A1A",
            }}
          >
            {manga.chapters.downloaded}
          </span>
          <span
            className="text-xs ml-1"
            style={{
              fontFamily: cormorant.style.fontFamily,
              color: "#BBB",
            }}
          >
            / {manga.chapters.total ?? "??"}
          </span>
        </div>

        {/* Size */}
        <span
          className="hidden md:block text-[11px] tracking-[0.05em] w-16 text-right shrink-0"
          style={{
            fontFamily: outfit.style.fontFamily,
            color: "#BBB",
          }}
        >
          {manga.sizeOnDisk}
        </span>
      </div>

      {/* Vermillion download progress underline */}
      <div
        className="absolute bottom-0 left-0 h-[2px] transition-all duration-500"
        style={{
          width: `${percent}%`,
          backgroundColor: "#D14836",
          opacity: percent > 0 ? 1 : 0,
        }}
      />

      {/* Hover reveal: download details */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: hovered ? "60px" : "0",
          opacity: hovered ? 1 : 0,
        }}
      >
        <div
          className="flex items-center gap-6 pb-4 px-2 md:pl-20"
          style={{
            fontFamily: outfit.style.fontFamily,
            fontSize: "11px",
            color: "#999",
          }}
        >
          <span>
            Status:{" "}
            <span style={{ color: "#D14836" }}>{statusLabel(status)}</span>
          </span>
          <span>
            {manga.chapters.downloaded} of {manga.chapters.total ?? "??"}{" "}
            chapters downloaded
          </span>
          <span>{manga.sizeOnDisk}</span>
          {manga.lastUpdated && <span>Updated {manga.lastUpdated}</span>}
        </div>
      </div>
    </div>
  );
}

export default function Option2Page() {
  // Determine the most-downloaded title
  const sorted = [...sampleManga].sort(
    (a, b) => b.chapters.downloaded - a.chapters.downloaded
  );
  const hero = sorted[0];
  const rest = sorted.slice(1);

  return (
    <div
      className={`${cormorant.variable} ${outfit.variable} min-h-screen relative`}
      style={{ backgroundColor: "#FAFAF7" }}
    >
      {/* Vertical sidebar: "COLLECTION" */}
      <div
        className="hidden md:flex fixed left-0 top-0 h-screen w-14 items-center justify-center z-10"
        style={{ borderRight: "1px solid #E8E8E4" }}
      >
        <span
          className="text-[10px] tracking-[0.5em] uppercase select-none"
          style={{
            fontFamily: outfit.style.fontFamily,
            color: "#CCC",
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
          }}
        >
          Collection
        </span>
      </div>

      {/* Main content */}
      <main className="md:ml-14">
        {/* Header */}
        <header
          className="px-6 md:px-16 pt-10 md:pt-16 pb-6 md:pb-10 flex items-baseline justify-between"
          style={{ borderBottom: "1px solid #E8E8E4" }}
        >
          <div>
            <h1
              className="text-2xl md:text-3xl"
              style={{
                fontFamily: cormorant.style.fontFamily,
                fontWeight: 700,
                color: "#1A1A1A",
              }}
            >
              Manhwa Shelf
            </h1>
            <p
              className="text-[10px] tracking-[0.3em] uppercase mt-1"
              style={{
                fontFamily: outfit.style.fontFamily,
                color: "#BBB",
              }}
            >
              Download Manager
            </p>
          </div>
          <p
            className="text-xs"
            style={{
              fontFamily: outfit.style.fontFamily,
              color: "#CCC",
            }}
          >
            {sampleManga.length} titles
          </p>
        </header>

        {/* Hero */}
        <div className="px-6 md:px-16 pt-10 md:pt-16">
          <HeroCard manga={hero} />
        </div>

        {/* Section label */}
        <div
          className="px-6 md:px-16 pb-4 flex items-baseline justify-between"
          style={{ borderBottom: "1px solid #E8E8E4" }}
        >
          <p
            className="text-[10px] tracking-[0.3em] uppercase"
            style={{
              fontFamily: outfit.style.fontFamily,
              color: "#BBB",
            }}
          >
            All Titles
          </p>
          <p
            className="text-[10px] tracking-[0.1em] uppercase"
            style={{
              fontFamily: outfit.style.fontFamily,
              color: "#CCC",
            }}
          >
            Sorted by chapters
          </p>
        </div>

        {/* Vertical list */}
        <div className="px-6 md:px-16">
          {rest.map((manga, i) => (
            <ListRow key={manga.id} manga={manga} index={i} />
          ))}
        </div>

        {/* Footer */}
        <footer className="px-6 md:px-16 py-12 md:py-20 mt-8">
          <div
            className="pt-8"
            style={{ borderTop: "1px solid #E8E8E4" }}
          >
            <p
              className="text-[10px] tracking-[0.3em] uppercase"
              style={{
                fontFamily: outfit.style.fontFamily,
                color: "#CCC",
              }}
            >
              Manhwa Shelf &mdash; Minimal Editorial
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
