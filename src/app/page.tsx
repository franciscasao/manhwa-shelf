"use client";

import { LibraryHeader } from "@/components/library-header";
import { MangaTable } from "@/components/manga-table";
import { useShelf } from "@/hooks/use-shelf";

export default function Home() {
  const { shelf, isHydrated } = useShelf();

  const totalTitles = isHydrated ? shelf.length : null;
  const totalChapters = isHydrated
    ? shelf.reduce((sum, m) => sum + m.chapters.downloaded, 0)
    : null;
  const totalSizeGB = isHydrated
    ? shelf.reduce((sum, m) => {
        const match = m.sizeOnDisk.match(/([\d.]+)\s*(GB|MB)/i);
        if (!match) return sum;
        const val = parseFloat(match[1]);
        return sum + (match[2].toUpperCase() === "GB" ? val : val / 1024);
      }, 0)
    : null;

  return (
    <div
      className="font-mono relative min-h-screen overflow-hidden bg-terminal-bg text-terminal-green"
    >
      {/* CRT scan-line overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px] animate-[flicker_4s_infinite] px-3 py-6 md:px-8 md:py-10">
        <LibraryHeader
          totalTitles={totalTitles}
          totalChapters={totalChapters}
          totalSizeGB={totalSizeGB}
        />

        {/* Boot sequence */}
        <div className="mb-4 text-xs text-terminal-muted">
          <div>{">"} initializing download manager...</div>
          <div>{">"} scanning local archive...</div>
          <div>
            {">"} found {totalTitles ?? "—"} titles (
            {totalChapters != null ? totalChapters.toLocaleString() : "—"}{" "}
            chapters indexed)
          </div>
          <div className="text-terminal-green">{">"} ready.</div>
        </div>

        <MangaTable manga={shelf} />

        {/* Footer */}
        <div className="mt-6 border-t border-terminal-border pt-4 text-xs text-terminal-muted">
          <div className="flex flex-col gap-1 md:flex-row md:justify-between">
            <span>
              <span className="text-terminal-dim">{"["}</span>
              <span className="text-terminal-green">OK</span>
              <span className="text-terminal-dim">{"]"}</span> manhwa-shelf
              daemon running on port 9090
            </span>
            <span>
              session: 0x4f2a
              <span className="text-terminal-muted"> | </span>
              uptime: 14d 7h 23m
              <span className="text-terminal-muted"> | </span>
              <span className="text-terminal-green">
                connected
                <span className="blink-cursor">_</span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
