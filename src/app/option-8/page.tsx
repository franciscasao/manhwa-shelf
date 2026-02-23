"use client";

import { useMemo } from "react";
import { Inter } from "next/font/google";
import { sampleManga } from "@/data/sample";
import { Manga, DownloadStatus } from "@/lib/types";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
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

const columnConfig: Record<string, { title: string; color: string; bgColor: string }> = {
  complete: { title: "Complete", color: "#22c55e", bgColor: "#f0fdf4" },
  partial: { title: "In Progress", color: "#3b82f6", bgColor: "#eff6ff" },
  "not-downloaded": { title: "Not Downloaded", color: "#94a3b8", bgColor: "#f8fafc" },
};

function DragHandle() {
  return (
    <div className="flex flex-col gap-[2px] opacity-30" style={{ cursor: "grab" }}>
      <div className="flex gap-[2px]">
        <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#94a3b8" }} />
        <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#94a3b8" }} />
      </div>
      <div className="flex gap-[2px]">
        <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#94a3b8" }} />
        <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#94a3b8" }} />
      </div>
      <div className="flex gap-[2px]">
        <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#94a3b8" }} />
        <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#94a3b8" }} />
      </div>
    </div>
  );
}

function KanbanCard({ manga }: { manga: Manga }) {
  const status = getDownloadStatus(manga);
  const percent = getDownloadPercent(manga);
  const config = columnConfig[status];

  return (
    <div className="kanban-card" style={{
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 14,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      border: "1px solid #e5e7eb",
    }}>
      <div className="flex items-start gap-2">
        <DragHandle />
        <div className="flex-1 min-w-0">
          {/* Header with cover thumbnail */}
          <div className="flex items-start gap-3">
            <div
              style={{
                width: 40,
                height: 54,
                borderRadius: 6,
                backgroundImage: `url(${manga.coverImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                flexShrink: 0,
              }}
            />
            <div className="min-w-0 flex-1">
              <h4 className={inter.className} style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", lineHeight: 1.3, marginBottom: 2 }}>
                {manga.title}
              </h4>
              <p className={inter.className} style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
                {manga.author}
              </p>
            </div>
          </div>

          {/* Genres as pills */}
          <div className="flex flex-wrap gap-1 mt-2.5">
            {manga.genres.map((genre) => (
              <span
                key={genre}
                className={inter.className}
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 9999,
                  backgroundColor: "#f1f5f9",
                  color: "#64748b",
                  fontWeight: 500,
                }}
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Progress */}
          <div className="mt-3 flex items-center gap-2">
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: config.color,
              }}
            />
            <span className={inter.className} style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>
              {manga.chapters.downloaded}/{manga.chapters.total ?? "??"} ch
            </span>
            <span className={inter.className} style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, marginLeft: "auto" }}>
              {percent}%
            </span>
          </div>

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between">
            <span className={inter.className} style={{ fontSize: 10, color: "#cbd5e1" }}>
              {manga.sizeOnDisk}
            </span>
            <div className="flex items-center gap-1">
              <span style={{ color: "#f59e0b", fontSize: 10 }}>{"\u2605"}</span>
              <span className={inter.className} style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
                {manga.rating}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Option8Page() {
  const columns = useMemo(() => {
    const grouped: Record<string, Manga[]> = {
      complete: [],
      partial: [],
      "not-downloaded": [],
    };
    sampleManga.forEach((m) => {
      const status = getDownloadStatus(m);
      if (grouped[status]) grouped[status].push(m);
    });
    return grouped;
  }, []);

  const totalChapters = sampleManga.reduce(
    (acc, m) => acc + m.chapters.downloaded,
    0
  );

  return (
    <div
      className={`${inter.variable} min-h-screen`}
      style={{ backgroundColor: "#f1f3f5", fontFamily: "var(--font-inter)" }}
    >
      <style>{`
        .kanban-card {
          transition: all 0.15s ease;
        }
        .kanban-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04) !important;
        }
      `}</style>

      {/* Header */}
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "20px 0" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={inter.className} style={{ fontSize: 22, fontWeight: 700, color: "#1e293b" }}>
                Manhwa Shelf
              </h1>
              <p className={inter.className} style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>
                {sampleManga.length} titles &middot; {totalChapters.toLocaleString()} chapters downloaded
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: "70vh" }}>
          {(["complete", "partial", "not-downloaded"] as const).map((statusKey) => {
            const config = columnConfig[statusKey];
            const items = columns[statusKey];

            return (
              <div key={statusKey} style={{
                backgroundColor: config.bgColor,
                borderRadius: 12,
                padding: 16,
                border: "1px solid #e5e7eb",
              }}>
                {/* Column header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: 9999,
                        backgroundColor: config.color,
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                      className={inter.className}
                    >
                      {config.title}
                    </span>
                  </div>
                  <span
                    className={inter.className}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      backgroundColor: "rgba(0,0,0,0.06)",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#64748b",
                    }}
                  >
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-3">
                  {items.map((manga) => (
                    <KanbanCard key={manga.id} manga={manga} />
                  ))}
                </div>

                {items.length === 0 && (
                  <div className="text-center py-8">
                    <p className={inter.className} style={{ fontSize: 13, color: "#94a3b8" }}>
                      No items
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: "16px 0", borderTop: "1px solid #e5e7eb" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <p className={inter.className} style={{ fontSize: 12, color: "#94a3b8" }}>
            Kanban Board UI
          </p>
          <p className={inter.className} style={{ fontSize: 12, color: "#cbd5e1" }}>
            Manhwa Shelf
          </p>
        </div>
      </footer>
    </div>
  );
}
