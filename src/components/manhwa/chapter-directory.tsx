"use client";

import { useState } from "react";

interface ChapterDirectoryProps {
  totalChapters: number | null;
  downloaded: number;
  isOnShelf: boolean;
}

const PER_PAGE = 50;

export function ChapterDirectory({ totalChapters, downloaded, isOnShelf }: ChapterDirectoryProps) {
  const [page, setPage] = useState(0);

  // Determine effective total
  const effectiveTotal = totalChapters ?? (isOnShelf && downloaded > 0 ? downloaded : null);

  if (effectiveTotal == null || effectiveTotal === 0) {
    return (
      <div className="border border-terminal-border/40 px-4 py-3">
        <div className="text-[0.6rem] text-terminal-muted tracking-widest mb-2">
          --- CHAPTER DIRECTORY ---
        </div>
        <div className="text-xs text-terminal-dim">
          {">"} chapter count unknown (ongoing series)
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(effectiveTotal / PER_PAGE);
  const start = page * PER_PAGE + 1;
  const end = Math.min((page + 1) * PER_PAGE, effectiveTotal);

  const chapters = [];
  for (let i = start; i <= end; i++) {
    const num = String(i).padStart(3, "0");
    let status: "DONE" | "SYNC" | "WAIT";
    let colorClass: string;
    let bar: string;
    let perm: string;

    if (i <= downloaded) {
      status = "DONE";
      colorClass = "text-terminal-green";
      bar = "\u2588".repeat(8);
      perm = "drwxr-xr-x";
    } else if (i === downloaded + 1 && isOnShelf) {
      status = "SYNC";
      colorClass = "text-terminal-cyan";
      bar = "\u2588".repeat(4) + "\u2591".repeat(4);
      perm = "drwxr-xr-x";
    } else {
      status = "WAIT";
      colorClass = "text-terminal-dim";
      bar = "\u2591".repeat(8);
      perm = "-rw-r--r--";
    }

    chapters.push(
      <div key={i} className={`${colorClass} flex items-center gap-2 text-[0.65rem] leading-relaxed`}>
        <span className="text-terminal-dim w-[80px] shrink-0 hidden sm:inline">{perm}</span>
        <span className="w-[90px] shrink-0">Chapter {num}</span>
        <span className="w-[70px] shrink-0 hidden sm:inline">{bar}</span>
        <span className="shrink-0">{status}</span>
      </div>
    );
  }

  return (
    <div className="border border-terminal-border/40 px-4 py-3">
      <div className="text-[0.6rem] text-terminal-muted tracking-widest mb-2">
        --- CHAPTER DIRECTORY --- {effectiveTotal} entries
        {isOnShelf && downloaded > 0 && <span> — {downloaded} cached</span>}
      </div>

      <div className="space-y-0">
        {chapters}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3 mt-3 text-xs">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className={`font-mono ${
              page === 0
                ? "text-terminal-dim cursor-not-allowed"
                : "text-terminal-cyan hover:text-terminal-green"
            }`}
          >
            [ &lt; PREV PAGE ]
          </button>
          <span className="text-terminal-muted text-[0.6rem]">
            {page + 1}/{totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className={`font-mono ${
              page >= totalPages - 1
                ? "text-terminal-dim cursor-not-allowed"
                : "text-terminal-cyan hover:text-terminal-green"
            }`}
          >
            [ &gt; NEXT PAGE ]
          </button>
        </div>
      )}
    </div>
  );
}
