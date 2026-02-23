"use client";

import { useState } from "react";
import { Familjen_Grotesk, IBM_Plex_Mono } from "next/font/google";
import Image from "next/image";
import { sampleManga } from "@/data/sample";
import { Manga, DownloadStatus } from "@/lib/types";

const grotesk = Familjen_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-grotesk",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
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

function getStatusLabel(status: DownloadStatus): string {
  switch (status) {
    case "complete":
      return "COMPLETE";
    case "partial":
      return "IN PROGRESS";
    case "not-downloaded":
      return "NOT DOWNLOADED";
    case "queued":
      return "QUEUED";
  }
}

function getDownloadPercent(manga: Manga): number {
  if (manga.chapters.downloaded === 0) return 0;
  if (!manga.chapters.total) return 65;
  return Math.round(
    (manga.chapters.downloaded / manga.chapters.total) * 100
  );
}

function StatusBadge({ status }: { status: DownloadStatus }) {
  const bg =
    status === "complete"
      ? "#DFFF00"
      : status === "not-downloaded"
        ? "#FF3333"
        : "#FFF";
  const color =
    status === "not-downloaded" ? "#FFF" : "#000";

  return (
    <span
      className={`${mono.className} inline-block border-3 border-black px-2 py-0.5 text-xs font-bold uppercase tracking-wider`}
      style={{ backgroundColor: bg, color }}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function DownloadBar({
  manga,
  status,
}: {
  manga: Manga;
  status: DownloadStatus;
}) {
  const percent = getDownloadPercent(manga);
  const fillColor =
    status === "complete"
      ? "#DFFF00"
      : status === "not-downloaded"
        ? "#FF3333"
        : "#DFFF00";

  return (
    <div className="mt-3 w-full">
      <div className="flex items-end justify-between mb-1">
        <span
          className={`${mono.className} text-3xl font-bold leading-none`}
          style={{ color: "#000" }}
        >
          {manga.chapters.downloaded}
          <span className="text-sm font-normal text-neutral-500">
            /{manga.chapters.total ?? "??"}
          </span>
        </span>
        <span
          className={`${mono.className} text-xs font-semibold`}
          style={{ color: "#555" }}
        >
          {percent}%
        </span>
      </div>
      <div
        className="relative w-full border-3 border-black"
        style={{ height: "18px", backgroundColor: "#E5E5E5" }}
      >
        <div
          className="absolute top-0 left-0 h-full"
          style={{
            width: `${percent}%`,
            backgroundColor: fillColor,
            transition: "none",
          }}
        />
      </div>
    </div>
  );
}

function ManhwaCard({ manga }: { manga: Manga }) {
  const status = getDownloadStatus(manga);

  return (
    <div
      className="brutalist-card relative flex flex-col border-4 border-black bg-white"
      style={{
        boxShadow: "6px 6px 0px #000",
      }}
    >
      {/* Cover Image */}
      <div
        className="relative w-full overflow-hidden border-b-4 border-black"
        style={{ aspectRatio: "3/4" }}
      >
        <Image
          src={manga.coverImage}
          alt={manga.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          unoptimized
        />
        {/* Rating badge */}
        <div
          className={`${mono.className} absolute top-0 right-0 border-b-4 border-l-4 border-black px-3 py-1 text-lg font-bold`}
          style={{ backgroundColor: "#DFFF00" }}
        >
          {manga.rating}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Status */}
        <div className="mb-2">
          <StatusBadge status={status} />
        </div>

        {/* Title */}
        <h2
          className={`${grotesk.className} text-xl font-bold leading-tight tracking-tight text-black`}
          style={{ lineHeight: 1.1 }}
        >
          {manga.title}
        </h2>

        {/* Author */}
        <p
          className={`${mono.className} mt-1 text-xs font-medium uppercase tracking-widest`}
          style={{ color: "#666" }}
        >
          {manga.author}
        </p>

        {/* Genres */}
        <div className="mt-3 flex flex-wrap gap-1">
          {manga.genres.map((genre) => (
            <span
              key={genre}
              className={`${mono.className} border-2 border-black px-1.5 py-0.5 text-[10px] font-semibold uppercase`}
              style={{ backgroundColor: "#F5F5F5" }}
            >
              {genre}
            </span>
          ))}
        </div>

        {/* Download bar */}
        <div className="mt-auto pt-3">
          <DownloadBar manga={manga} status={status} />
        </div>

        {/* Footer info */}
        <div
          className="mt-3 flex items-center justify-between border-t-3 border-black pt-2"
        >
          <span
            className={`${mono.className} text-xs font-bold`}
            style={{ color: "#000" }}
          >
            {manga.sizeOnDisk}
          </span>
          {manga.lastUpdated && (
            <span
              className={`${mono.className} text-[10px]`}
              style={{ color: "#888" }}
            >
              {manga.lastUpdated}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Option1Page() {
  const [filter, setFilter] = useState<DownloadStatus | "all">("all");

  const filtered =
    filter === "all"
      ? sampleManga
      : sampleManga.filter((m) => getDownloadStatus(m) === filter);

  const stats = {
    total: sampleManga.length,
    complete: sampleManga.filter(
      (m) => getDownloadStatus(m) === "complete"
    ).length,
    partial: sampleManga.filter(
      (m) => getDownloadStatus(m) === "partial"
    ).length,
    notDownloaded: sampleManga.filter(
      (m) => getDownloadStatus(m) === "not-downloaded"
    ).length,
    totalChapters: sampleManga.reduce(
      (acc, m) => acc + m.chapters.downloaded,
      0
    ),
  };

  const filterOptions: { label: string; value: DownloadStatus | "all" }[] = [
    { label: "ALL", value: "all" },
    { label: "COMPLETE", value: "complete" },
    { label: "IN PROGRESS", value: "partial" },
    { label: "NOT DL'd", value: "not-downloaded" },
  ];

  return (
    <div
      className={`${grotesk.variable} ${mono.variable} min-h-screen`}
      style={{ backgroundColor: "#F0EDE6" }}
    >
      <style>{`
        .brutalist-card:hover {
          transform: translate(-4px, -4px) !important;
          box-shadow: 10px 10px 0px #000 !important;
        }
        .brutalist-btn:hover {
          transform: translate(-2px, -2px) !important;
          box-shadow: 6px 6px 0px #000 !important;
        }
      `}</style>

      {/* Hero / Header */}
      <header
        className="relative overflow-hidden border-b-4 border-black"
        style={{ backgroundColor: "#DFFF00" }}
      >
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          {/* Decorative background text */}
          <div
            className={`${grotesk.className} pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2 select-none text-[12rem] font-bold leading-none opacity-[0.07] sm:text-[18rem]`}
          >
            DL
          </div>

          <div className="relative z-10">
            <p
              className={`${mono.className} mb-2 text-xs font-bold uppercase tracking-[0.3em]`}
              style={{ color: "#333" }}
            >
              Download Manager
            </p>
            <h1
              className={`${grotesk.className} text-5xl font-bold uppercase leading-[0.9] tracking-tighter text-black sm:text-7xl lg:text-8xl`}
            >
              Manhwa
              <br />
              Shelf
            </h1>
            <div
              className={`${mono.className} mt-6 inline-block border-4 border-black bg-black px-4 py-2 text-sm font-bold uppercase tracking-wider`}
              style={{ color: "#DFFF00" }}
            >
              {stats.totalChapters.toLocaleString()} chapters archived
            </div>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="border-b-4 border-black bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-0">
          {[
            { label: "TITLES", value: stats.total },
            { label: "COMPLETE", value: stats.complete },
            { label: "PARTIAL", value: stats.partial },
            { label: "PENDING", value: stats.notDownloaded },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`flex-1 border-black px-4 py-4 sm:px-6 ${
                i < 3 ? "border-r-4" : ""
              }`}
              style={{ minWidth: "120px" }}
            >
              <p
                className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.2em]`}
                style={{ color: "#999" }}
              >
                {stat.label}
              </p>
              <p
                className={`${mono.className} text-3xl font-bold text-black sm:text-4xl`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Section Header + Filters */}
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div style={{ transform: "rotate(-2deg)" }}>
            <h2
              className={`${grotesk.className} border-b-4 border-black pb-1 text-3xl font-bold uppercase tracking-tight text-black sm:text-4xl`}
              style={{
                display: "inline-block",
                backgroundColor: "#DFFF00",
                padding: "4px 12px",
              }}
            >
              Your Library
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`${mono.className} brutalist-btn border-3 border-black px-3 py-1.5 text-xs font-bold uppercase tracking-wider`}
                style={{
                  backgroundColor:
                    filter === opt.value ? "#000" : "#FFF",
                  color: filter === opt.value ? "#DFFF00" : "#000",
                  boxShadow:
                    filter === opt.value
                      ? "none"
                      : "4px 4px 0px #000",
                  transform:
                    filter === opt.value
                      ? "translate(2px, 2px)"
                      : "none",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((manga) => (
            <ManhwaCard key={manga.id} manga={manga} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div
            className="border-4 border-black bg-white p-12 text-center"
            style={{ boxShadow: "6px 6px 0px #000" }}
          >
            <p
              className={`${grotesk.className} text-2xl font-bold uppercase text-black`}
            >
              No titles found
            </p>
            <p
              className={`${mono.className} mt-2 text-sm`}
              style={{ color: "#666" }}
            >
              Try a different filter.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-black px-4 py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <p
            className={`${mono.className} text-xs font-bold uppercase tracking-widest`}
            style={{ color: "#DFFF00" }}
          >
            Manhwa Shelf v1.0
          </p>
          <p
            className={`${mono.className} text-xs`}
            style={{ color: "#666" }}
          >
            Neo-Brutalist UI
          </p>
        </div>
      </footer>
    </div>
  );
}
