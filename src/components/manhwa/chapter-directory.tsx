"use client";

import { useState } from "react";
import Link from "next/link";
import type { SourceChapter } from "@/extensions";
import type { ChapterProgress, DownloadQueueItem } from "@/lib/types";

interface ChapterDirectoryProps {
  totalChapters: number | null;
  downloaded: number;
  isOnShelf: boolean;
  chapters?: SourceChapter[] | null;
  sourceId?: string;
  mangaId?: string;
  anilistId?: number;
  currentProgress?: ChapterProgress | null;
  downloadedChapters?: Set<number>;
  queueLength?: number;
  isDownloading?: boolean;
  onDownloadChapter?: (item: DownloadQueueItem) => void;
  onDownloadAll?: (items: DownloadQueueItem[]) => void;
  onCancelDownload?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoadingChapters?: boolean;
}

const PER_PAGE = 50;

function getChapterStatus(
  index: number,
  downloaded: number,
  isOnShelf: boolean,
  sessionDownloaded?: Set<number>,
  currentProgress?: ChapterProgress | null,
) {
  // Check if this chapter is currently downloading
  if (currentProgress && currentProgress.chapterNum === index) {
    const { state, imagesDownloaded, imagesTotal } = currentProgress;
    if (state === "fetching-pages") {
      return {
        status: "SCAN" as const,
        colorClass: "text-terminal-cyan",
        bar: "\u2593".repeat(2) + "\u2591".repeat(6),
        perm: "drwxr-xr-x",
        statusLabel: "SCAN",
      };
    }
    if (state === "downloading") {
      const filled = imagesTotal > 0 ? Math.round((imagesDownloaded / imagesTotal) * 8) : 0;
      return {
        status: "SYNC" as const,
        colorClass: "text-terminal-orange",
        bar: "\u2588".repeat(filled) + "\u2591".repeat(8 - filled),
        perm: "drwxr-xr-x",
        statusLabel: `${imagesDownloaded}/${imagesTotal}`,
      };
    }
    if (state === "uploading") {
      return {
        status: "UPLOAD" as const,
        colorClass: "text-terminal-cyan",
        bar: "\u2588".repeat(7) + "\u2593",
        perm: "drwxr-xr-x",
        statusLabel: "UPLOAD",
      };
    }
    if (state === "error") {
      return {
        status: "ERR" as const,
        colorClass: "text-red-400",
        bar: "\u2591".repeat(8),
        perm: "-rw-r--r--",
        statusLabel: "ERR",
      };
    }
  }

  // Check if downloaded this session
  if (sessionDownloaded?.has(index)) {
    return {
      status: "DONE" as const,
      colorClass: "text-terminal-green",
      bar: "\u2588".repeat(8),
      perm: "drwxr-xr-x",
      statusLabel: "DONE",
    };
  }

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

  return { status, colorClass, bar, perm, statusLabel: status };
}

function Pagination({
  page,
  totalPages,
  setPage,
}: {
  page: number;
  totalPages: number;
  setPage: (fn: (p: number) => number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-3 mt-3 text-xs">
      <button
        onClick={() => setPage((p) => Math.max(0, p - 1))}
        disabled={page === 0}
        className={`font-mono ${
          page === 0 ? "text-terminal-dim cursor-not-allowed" : "text-terminal-cyan hover:text-terminal-green"
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
  chapters,
  sourceId,
  mangaId,
  anilistId,
  currentProgress,
  downloadedChapters,
  queueLength,
  isDownloading,
  onDownloadChapter,
  onDownloadAll,
  onCancelDownload,
  onRefresh,
  isRefreshing,
  isLoadingChapters,
}: ChapterDirectoryProps) {
  const [page, setPage] = useState(0);

  const hasChapters = chapters && chapters.length > 0;

  // Loading state — show terminal-style progress while fetching chapters
  if (isLoadingChapters && !hasChapters) {
    return (
      <div className="border border-terminal-border/40 px-4 py-3">
        <div className="text-[0.6rem] text-terminal-muted tracking-widest mb-2">
          --- CHAPTER DIRECTORY ---
        </div>
        <div className="text-xs space-y-1">
          <div className="text-terminal-dim">{"> "}querying source index...</div>
          <div className="text-terminal-orange">
            {"> "}fetching chapter manifest<span className="blink-cursor">_</span>
          </div>
        </div>
      </div>
    );
  }

  // Source chapters available — render real episode list
  if (hasChapters) {
    const sorted = [...chapters].sort((a, b) => (a.datePublished ?? 0) - (b.datePublished ?? 0));
    const totalEpisodes = sorted.length;
    const totalPages = Math.ceil(totalEpisodes / PER_PAGE);
    const start = page * PER_PAGE;
    const end = Math.min(start + PER_PAGE, totalEpisodes);
    const slice = sorted.slice(start, end);

    const handleDownloadAll = () => {
      if (!mangaId || !sourceId || !onDownloadAll) return;
      const items: DownloadQueueItem[] = sorted.map((ch, idx) => ({
        mangaId,
        chapterNum: idx + 1,
        episodeTitle: ch.title,
        chapterUrl: ch.url,
        sourceId,
      }));
      onDownloadAll(items);
    };

    return (
      <div className="border border-terminal-border/40 px-4 py-3">
        <div className="text-[0.6rem] text-terminal-muted tracking-widest mb-2 flex items-center justify-between">
          <span>
            --- CHAPTER DIRECTORY --- {totalEpisodes} entries
            {isOnShelf && downloaded > 0 && <span> — {downloaded} cached</span>}
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`font-mono ${
                isRefreshing
                  ? "text-terminal-orange cursor-wait"
                  : "text-terminal-cyan hover:text-terminal-green"
              }`}
            >
              {isRefreshing ? "[ SCANNING... ]" : "[ REFRESH ]"}
            </button>
          )}
        </div>

        {/* Download controls */}
        {mangaId && sourceId && onDownloadAll && (
          <div className="flex items-center gap-3 mb-2 text-[0.65rem]">
            {isDownloading ? (
              <>
                {currentProgress && (
                  <span className="text-terminal-orange">
                    {">"} downloading ch.
                    {String(currentProgress.chapterNum).padStart(3, "0")}
                    {currentProgress.state === "downloading" &&
                      ` [${currentProgress.imagesDownloaded}/${currentProgress.imagesTotal}]`}
                    {currentProgress.state === "fetching-pages" && " [scanning]"}
                    {currentProgress.state === "uploading" && " [uploading to db]"}
                  </span>
                )}
                {(queueLength ?? 0) > 1 && <span className="text-terminal-dim">({(queueLength ?? 1) - 1} queued)</span>}
                <button onClick={onCancelDownload} className="text-red-400 hover:text-red-300">
                  [ CANCEL ]
                </button>
              </>
            ) : (
              <button onClick={handleDownloadAll} className="text-terminal-cyan hover:text-terminal-green">
                [ DOWNLOAD ALL ]
              </button>
            )}
          </div>
        )}

        {currentProgress?.state === "error" && (
          <div className="text-[0.6rem] text-red-400 mb-1">
            {">"} error on ch.{currentProgress.chapterNum}: {currentProgress.error}
          </div>
        )}

        <div className="space-y-0">
          {slice.map((ch, idx) => {
            const chapterNum = start + idx + 1;
            const num = String(chapterNum).padStart(3, "0");
            const { colorClass, bar, perm, statusLabel } = getChapterStatus(
              chapterNum,
              downloaded,
              isOnShelf,
              downloadedChapters,
              currentProgress,
            );

            const isChapterDownloaded = downloadedChapters?.has(chapterNum);
            const canDownload = mangaId && sourceId && onDownloadChapter && !isDownloading && !isChapterDownloaded;

            const row = (
              <div
                key={chapterNum}
                className={`${colorClass} flex items-center gap-2 text-[0.65rem] leading-relaxed${isChapterDownloaded && anilistId ? " hover:bg-terminal-row-hover cursor-pointer" : ""}`}
              >
                <span className="text-terminal-dim w-[80px] shrink-0 hidden sm:inline">{perm}</span>
                <span className="w-[30px] shrink-0">{num}</span>
                <span className="truncate flex-1 min-w-0">{ch.title}</span>
                <span className="w-[70px] shrink-0 hidden sm:inline">{bar}</span>
                <span className="shrink-0 w-[36px] text-right">{statusLabel}</span>
                {isChapterDownloaded && anilistId ? (
                  <Link
                    href={`/manhwa/${anilistId}/read/${chapterNum}`}
                    className="shrink-0 text-terminal-cyan hover:text-terminal-green text-[0.6rem]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    [ READ ]
                  </Link>
                ) : canDownload ? (
                  <button
                    onClick={() =>
                      onDownloadChapter({
                        mangaId,
                        chapterNum,
                        episodeTitle: ch.title,
                        chapterUrl: ch.url,
                        sourceId,
                      })
                    }
                    className="shrink-0 text-terminal-cyan hover:text-terminal-green text-[0.6rem]"
                  >
                    [ DL ]
                  </button>
                ) : null}
              </div>
            );

            if (isChapterDownloaded && anilistId) {
              return (
                <Link key={chapterNum} href={`/manhwa/${anilistId}/read/${chapterNum}`} className="block">
                  {row}
                </Link>
              );
            }
            return row;
          })}
        </div>

        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </div>
    );
  }

  // Generated chapter list (fallback when no source chapters available)
  const effectiveTotal = totalChapters ?? (isOnShelf && downloaded > 0 ? downloaded : null);

  if (effectiveTotal == null || effectiveTotal === 0) {
    return (
      <div className="border border-terminal-border/40 px-4 py-3">
        <div className="text-[0.6rem] text-terminal-muted tracking-widest mb-2">--- CHAPTER DIRECTORY ---</div>
        <div className="text-xs text-terminal-dim">{">"} chapter count unknown (ongoing series)</div>
      </div>
    );
  }

  const totalPages = Math.ceil(effectiveTotal / PER_PAGE);
  const start = page * PER_PAGE + 1;
  const end = Math.min((page + 1) * PER_PAGE, effectiveTotal);

  const chapterRows = [];
  for (let i = start; i <= end; i++) {
    const num = String(i).padStart(3, "0");
    const { colorClass, bar, perm, statusLabel } = getChapterStatus(i, downloaded, isOnShelf, downloadedChapters);
    const isChapterDownloaded = downloadedChapters?.has(i);

    const row = (
      <div
        className={`${colorClass} flex items-center gap-2 text-[0.65rem] leading-relaxed${isChapterDownloaded && anilistId ? " hover:bg-terminal-row-hover cursor-pointer" : ""}`}
      >
        <span className="text-terminal-dim w-[80px] shrink-0 hidden sm:inline">{perm}</span>
        <span className="w-[90px] shrink-0">Chapter {num}</span>
        <span className="w-[70px] shrink-0 hidden sm:inline">{bar}</span>
        <span className="shrink-0">{statusLabel}</span>
        {isChapterDownloaded && anilistId && (
          <Link
            href={`/manhwa/${anilistId}/read/${i}`}
            className="shrink-0 text-terminal-cyan hover:text-terminal-green text-[0.6rem]"
            onClick={(e) => e.stopPropagation()}
          >
            [ READ ]
          </Link>
        )}
      </div>
    );

    if (isChapterDownloaded && anilistId) {
      chapterRows.push(
        <Link key={i} href={`/manhwa/${anilistId}/read/${i}`} className="block">
          {row}
        </Link>,
      );
    } else {
      chapterRows.push(<div key={i}>{row}</div>);
    }
  }

  return (
    <div className="border border-terminal-border/40 px-4 py-3">
      <div className="text-[0.6rem] text-terminal-muted tracking-widest mb-2">
        --- CHAPTER DIRECTORY --- {effectiveTotal} entries
        {isOnShelf && downloaded > 0 && <span> — {downloaded} cached</span>}
      </div>

      <div className="space-y-0">{chapterRows}</div>

      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  );
}
