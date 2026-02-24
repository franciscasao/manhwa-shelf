"use client";

import { useState } from "react";
import type { WebtoonEpisode } from "@/lib/webtoon";
import type { ChapterProgress, DownloadQueueItem } from "@/lib/types";

interface ChapterDirectoryProps {
  totalChapters: number | null;
  downloaded: number;
  isOnShelf: boolean;
  webtoonEpisodes?: WebtoonEpisode[] | null;
  webtoonLoading?: boolean;
  webtoonError?: string | null;
  webtoonUrl?: string;
  onRefetch?: () => void;
  mangaId?: string;
  currentProgress?: ChapterProgress | null;
  downloadedChapters?: Set<number>;
  queueLength?: number;
  isDownloading?: boolean;
  onDownloadChapter?: (item: DownloadQueueItem) => void;
  onDownloadAll?: (items: DownloadQueueItem[]) => void;
  onCancelDownload?: () => void;
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
  mangaId,
  currentProgress,
  downloadedChapters,
  queueLength,
  isDownloading,
  onDownloadChapter,
  onDownloadAll,
  onCancelDownload,
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

    const handleDownloadAll = () => {
      if (!mangaId || !onDownloadAll) return;
      const items: DownloadQueueItem[] = sorted.map((ep, idx) => ({
        mangaId,
        chapterNum: idx + 1,
        episodeTitle: ep.episodeTitle,
        viewerLink: ep.viewerLink,
      }));
      onDownloadAll(items);
    };

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

        {/* Download controls */}
        {mangaId && onDownloadAll && (
          <div className="flex items-center gap-3 mb-2 text-[0.65rem]">
            {isDownloading ? (
              <>
                {currentProgress && (
                  <span className="text-terminal-orange">
                    {">"} downloading ch.{String(currentProgress.chapterNum).padStart(3, "0")}
                    {currentProgress.state === "downloading" &&
                      ` [${currentProgress.imagesDownloaded}/${currentProgress.imagesTotal}]`}
                    {currentProgress.state === "fetching-pages" && " [scanning]"}
                    {currentProgress.state === "uploading" && " [uploading to db]"}
                  </span>
                )}
                {(queueLength ?? 0) > 1 && (
                  <span className="text-terminal-dim">
                    ({(queueLength ?? 1) - 1} queued)
                  </span>
                )}
                <button
                  onClick={onCancelDownload}
                  className="text-red-400 hover:text-red-300"
                >
                  [ CANCEL ]
                </button>
              </>
            ) : (
              <button
                onClick={handleDownloadAll}
                className="text-terminal-cyan hover:text-terminal-green"
              >
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

        {webtoonError && (
          <div className="text-[0.6rem] text-terminal-orange mb-1">
            {">"} partial fetch error: {webtoonError}
          </div>
        )}

        <div className="space-y-0">
          {slice.map((ep, idx) => {
            const chapterNum = start + idx + 1;
            const num = String(chapterNum).padStart(3, "0");
            const { colorClass, bar, perm, statusLabel } = getChapterStatus(
              chapterNum,
              downloaded,
              isOnShelf,
              downloadedChapters,
              currentProgress,
            );

            const canDownload =
              mangaId &&
              onDownloadChapter &&
              !isDownloading &&
              !downloadedChapters?.has(chapterNum);

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
                <span className="shrink-0 w-[36px] text-right">{statusLabel}</span>
                {canDownload && (
                  <button
                    onClick={() =>
                      onDownloadChapter({
                        mangaId,
                        chapterNum,
                        episodeTitle: ep.episodeTitle,
                        viewerLink: ep.viewerLink,
                      })
                    }
                    className="shrink-0 text-terminal-cyan hover:text-terminal-green text-[0.6rem]"
                  >
                    [ DL ]
                  </button>
                )}
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
    const { colorClass, bar, perm, statusLabel } = getChapterStatus(i, downloaded, isOnShelf);

    chapters.push(
      <div key={i} className={`${colorClass} flex items-center gap-2 text-[0.65rem] leading-relaxed`}>
        <span className="text-terminal-dim w-[80px] shrink-0 hidden sm:inline">{perm}</span>
        <span className="w-[90px] shrink-0">Chapter {num}</span>
        <span className="w-[70px] shrink-0 hidden sm:inline">{bar}</span>
        <span className="shrink-0">{statusLabel}</span>
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
