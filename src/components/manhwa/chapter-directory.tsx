"use client";

import { useState } from "react";
import type { WebtoonEpisode } from "@/lib/webtoon";

interface ChapterDirectoryProps {
  totalChapters: number | null;
  downloaded: number;
  isOnShelf: boolean;
  webtoonEpisodes?: WebtoonEpisode[] | null;
  webtoonLoading?: boolean;
  webtoonError?: string | null;
  webtoonUrl?: string;
  onRefetch?: () => void;
}

const PER_PAGE = 50;

function getChapterStatus(index: number, downloaded: number, isOnShelf: boolean) {
  let status: "DONE" | "SYNC" | "WAIT";
  let colorClass: string;
  let bar: string;
  let perm: string;

  if (index <= downloaded) {
    status = "DONE";
    colorClass = "text-terminal-green";
    bar = "\u2588".repeat(8);
    perm = "drwxr-xr-x";
  } else if (index === downloaded + 1 && isOnShelf) {
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

  return { status, colorClass, bar, perm };
}

function Pagination({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (fn: (p: number) => number) => void }) {
  if (totalPages <= 1) return null;
  return (
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
  );
}

export function ChapterDirectory({
  totalChapters,
  downloaded,
  isOnShelf,
  webtoonEpisodes,
  webtoonLoading,
  webtoonError,
  webtoonUrl,
  onRefetch,
}: ChapterDirectoryProps) {
  const [page, setPage] = useState(0);

  const hasWebtoonEpisodes = webtoonEpisodes && webtoonEpisodes.length > 0;

  // Webtoon loading state
  if (webtoonLoading) {
    return (
      <div className="border border-terminal-border/40 px-4 py-3">
        <div className="text-[0.6rem] text-terminal-muted tracking-widest mb-2">
          --- CHAPTER DIRECTORY ---
        </div>
        <div className="text-xs text-terminal-dim">
          {">"} fetching webtoon episodes<span className="blink-cursor">_</span>
        </div>
      </div>
    );
  }

  // Webtoon episodes available — render real episode list
  if (hasWebtoonEpisodes) {
    const sorted = [...webtoonEpisodes].sort(
      (a, b) => a.exposureDateMillis - b.exposureDateMillis,
    );
    const totalEpisodes = sorted.length;
    const totalPages = Math.ceil(totalEpisodes / PER_PAGE);
    const start = page * PER_PAGE;
    const end = Math.min(start + PER_PAGE, totalEpisodes);
    const slice = sorted.slice(start, end);

    return (
      <div className="border border-terminal-border/40 px-4 py-3">
        <div className="text-[0.6rem] text-terminal-muted tracking-widest mb-2">
          --- CHAPTER DIRECTORY --- {totalEpisodes} entries
          {isOnShelf && downloaded > 0 && <span> — {downloaded} cached</span>}
          <span className="text-terminal-cyan ml-2">via webtoon</span>
          {onRefetch && (
            <button
              onClick={onRefetch}
              disabled={webtoonLoading}
              className={`ml-2 ${
                webtoonLoading
                  ? "text-terminal-dim cursor-not-allowed"
                  : "text-terminal-cyan hover:text-terminal-green"
              }`}
            >
              [ REFETCH ]
            </button>
          )}
        </div>

        {webtoonError && (
          <div className="text-[0.6rem] text-terminal-orange mb-1">
            {">"} partial fetch error: {webtoonError}
          </div>
        )}

        <div className="space-y-0">
          {slice.map((ep, idx) => {
            const chapterNum = start + idx + 1;
            const num = String(chapterNum).padStart(3, "0");
            const { status, colorClass, bar, perm } = getChapterStatus(
              chapterNum,
              downloaded,
              isOnShelf,
            );

            return (
              <div
                key={chapterNum}
                className={`${colorClass} flex items-center gap-2 text-[0.65rem] leading-relaxed`}
              >
                <span className="text-terminal-dim w-[80px] shrink-0 hidden sm:inline">
                  {perm}
                </span>
                <span className="w-[30px] shrink-0">{num}</span>
                <span className="truncate flex-1 min-w-0">
                  {ep.episodeTitle}
                </span>
                <span className="w-[70px] shrink-0 hidden sm:inline">
                  {bar}
                </span>
                <span className="shrink-0">{status}</span>
              </div>
            );
          })}
        </div>

        <Pagination page={page} totalPages={totalPages} setPage={setPage} />

        {webtoonUrl && (
          <div className="mt-3 text-[0.6rem]">
            <a
              href={webtoonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-terminal-cyan hover:text-terminal-green transition-colors"
            >
              {">"} read on webtoons.com →
            </a>
          </div>
        )}
      </div>
    );
  }

  // Show error notice then fall through to generated list
  const showErrorNotice = webtoonError && !hasWebtoonEpisodes;

  // Generated chapter list (original behavior)
  const effectiveTotal = totalChapters ?? (isOnShelf && downloaded > 0 ? downloaded : null);

  if (effectiveTotal == null || effectiveTotal === 0) {
    return (
      <div className="border border-terminal-border/40 px-4 py-3">
        <div className="text-[0.6rem] text-terminal-muted tracking-widest mb-2">
          --- CHAPTER DIRECTORY ---
        </div>
        {showErrorNotice && (
          <div className="text-[0.6rem] text-terminal-orange mb-1">
            {">"} webtoon fetch failed, showing estimated chapters
          </div>
        )}
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
    const { status, colorClass, bar, perm } = getChapterStatus(i, downloaded, isOnShelf);

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

      {showErrorNotice && (
        <div className="text-[0.6rem] text-terminal-orange mb-1">
          {">"} webtoon fetch failed, showing estimated chapters
        </div>
      )}

      <div className="space-y-0">
        {chapters}
      </div>

      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  );
}
