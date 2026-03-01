"use client";

import { useState } from "react";
import Link from "next/link";
import type { SourceChapter } from "@/extensions";
import type { ChapterProgress, DownloadQueueItem } from "@/lib/types";
import { useChapterDownload } from "@/hooks/use-chapter-download";

interface ChapterDirectoryProps {
  totalChapters: number | null;
  downloaded: number;
  isOnShelf: boolean;
  chapters?: SourceChapter[] | null;
  sourceId?: string;
  mangaId: string;
  mangaTitle: string;
  anilistId?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoadingChapters?: boolean;
  sourceError?: string | null;
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

function DirectoryShell({
  entryCount,
  cached,
  onRefresh,
  isRefreshing,
  children,
}: {
  entryCount?: number;
  cached?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-terminal-border/40 px-4 py-3">
      <div className="text-[0.6rem] text-terminal-muted tracking-widest mb-2 flex items-center justify-between">
        <span>
          --- CHAPTER DIRECTORY ---
          {entryCount != null && <> {entryCount} entries</>}
          {cached != null && cached > 0 && <span> — {cached} cached</span>}
        </span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`font-mono ${
              isRefreshing ? "text-terminal-orange cursor-wait" : "text-terminal-cyan hover:text-terminal-green"
            }`}
          >
            {isRefreshing ? "[ SCANNING... ]" : "[ REFRESH ]"}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

const BATCH_SIZES = [5, 10, 15] as const;

function DownloadControls({
  isDownloading,
  currentProgress,
  queueLength,
  remainingCount,
  onDownloadBatch,
  onCancel,
}: {
  isDownloading: boolean;
  currentProgress: ChapterProgress | null;
  queueLength: number;
  remainingCount: number;
  onDownloadBatch: (count?: number) => void;
  onCancel: () => void;
}) {
  return (
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
          {queueLength > 1 && <span className="text-terminal-dim">({queueLength - 1} queued)</span>}
          <button onClick={onCancel} className="text-red-400 hover:text-red-300">
            [ CANCEL ]
          </button>
        </>
      ) : (
        <>
          {BATCH_SIZES.filter((n) => n < remainingCount).map((n) => (
            <button key={n} onClick={() => onDownloadBatch(n)} className="text-terminal-cyan hover:text-terminal-green">
              [ DL {n} ]
            </button>
          ))}
          {remainingCount > 0 && (
            <button onClick={() => onDownloadBatch()} className="text-terminal-cyan hover:text-terminal-green">
              [ DL ALL ]
            </button>
          )}
        </>
      )}
    </div>
  );
}

function ChapterRow({
  chapterNum,
  label,
  downloaded,
  isOnShelf,
  downloadedChapters,
  currentProgress,
  anilistId,
  onDownload,
}: {
  chapterNum: number;
  label: string;
  downloaded: number;
  isOnShelf: boolean;
  downloadedChapters: Set<number>;
  currentProgress: ChapterProgress | null;
  anilistId?: number;
  onDownload?: () => void;
}) {
  const num = String(chapterNum).padStart(3, "0");
  const { colorClass, bar, perm, statusLabel } = getChapterStatus(
    chapterNum,
    downloaded,
    isOnShelf,
    downloadedChapters,
    currentProgress,
  );
  const isChapterDownloaded = downloadedChapters.has(chapterNum);
  const readHref = anilistId ? `/manhwa/${anilistId}/read/${chapterNum}` : null;

  const row = (
    <div
      className={`${colorClass} flex items-center gap-2 text-[0.65rem] leading-relaxed${
        isChapterDownloaded && readHref ? " hover:bg-terminal-row-hover cursor-pointer" : ""
      }`}
    >
      <span className="text-terminal-dim w-[80px] shrink-0 hidden sm:inline">{perm}</span>
      <span className="w-[30px] shrink-0">{num}</span>
      <span className="truncate flex-1 min-w-0">{label}</span>
      <span className="w-[70px] shrink-0 hidden sm:inline">{bar}</span>
      <span className="shrink-0 w-[36px] text-right">{statusLabel}</span>
      {isChapterDownloaded && readHref ? (
        <span className="shrink-0 text-terminal-cyan hover:text-terminal-green text-[0.6rem]">[ READ ]</span>
      ) : onDownload ? (
        <button onClick={onDownload} className="shrink-0 text-terminal-cyan hover:text-terminal-green text-[0.6rem]">
          [ DL ]
        </button>
      ) : null}
    </div>
  );

  if (isChapterDownloaded && readHref) {
    return (
      <Link href={readHref} className="block">
        {row}
      </Link>
    );
  }
  return <div>{row}</div>;
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
  mangaTitle,
  anilistId,
  onRefresh,
  isRefreshing,
  isLoadingChapters,
  sourceError,
}: ChapterDirectoryProps) {
  const { queue, currentProgress, downloadedChapters, enqueueChapter, enqueueMany, cancelQueue, isDownloading } =
    useChapterDownload(mangaId, mangaTitle);
  const [page, setPage] = useState(0);

  const hasChapters = chapters && chapters.length > 0;

  const sharedRowProps = {
    downloaded,
    isOnShelf,
    downloadedChapters,
    currentProgress,
    anilistId,
  };

  // Loading state
  if (isLoadingChapters && !hasChapters) {
    return (
      <DirectoryShell>
        <div className="text-xs space-y-1">
          <div className="text-terminal-dim">{"> "}querying source index...</div>
          <div className="text-terminal-orange">
            {"> "}fetching chapter manifest<span className="blink-cursor">_</span>
          </div>
        </div>
      </DirectoryShell>
    );
  }

  // Source chapters available
  if (hasChapters) {
    const sorted = [...chapters].sort((a, b) => (a.datePublished ?? 0) - (b.datePublished ?? 0));
    const totalEpisodes = sorted.length;
    const totalPages = Math.ceil(totalEpisodes / PER_PAGE);
    const start = page * PER_PAGE;
    const slice = sorted.slice(start, Math.min(start + PER_PAGE, totalEpisodes));

    const undownloaded = sorted
      .map((ch, idx) => ({ ch, chapterNum: idx + 1 }))
      .filter(({ chapterNum }) => !downloadedChapters.has(chapterNum));

    const handleDownloadBatch = (count?: number) => {
      if (!sourceId) return;
      const batch = count != null ? undownloaded.slice(0, count) : undownloaded;
      const items: DownloadQueueItem[] = batch.map(({ ch, chapterNum }) => ({
        mangaId,
        chapterNum,
        episodeTitle: ch.title,
        chapterUrl: ch.url,
        sourceId,
      }));
      enqueueMany(items);
    };

    return (
      <DirectoryShell
        entryCount={totalEpisodes}
        cached={isOnShelf && downloaded > 0 ? downloaded : undefined}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      >
        {sourceId && (
          <DownloadControls
            isDownloading={isDownloading}
            currentProgress={currentProgress}
            queueLength={queue.length}
            remainingCount={undownloaded.length}
            onDownloadBatch={handleDownloadBatch}
            onCancel={cancelQueue}
          />
        )}

        {currentProgress?.state === "error" && (
          <div className="text-[0.6rem] text-red-400 mb-1">
            {">"} error on ch.{currentProgress.chapterNum}: {currentProgress.error}
          </div>
        )}

        <div className="space-y-0">
          {slice.map((ch, idx) => {
            const chapterNum = start + idx + 1;
            const canDl = sourceId && !isDownloading && !downloadedChapters.has(chapterNum);
            return (
              <ChapterRow
                key={chapterNum}
                chapterNum={chapterNum}
                label={ch.title}
                {...sharedRowProps}
                onDownload={
                  canDl
                    ? () =>
                        enqueueChapter({
                          mangaId,
                          chapterNum,
                          episodeTitle: ch.title,
                          chapterUrl: ch.url,
                          sourceId: sourceId!,
                        })
                    : undefined
                }
              />
            );
          })}
        </div>

        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </DirectoryShell>
    );
  }

  // Source found but fetch failed — show error with retry
  if (onRefresh && sourceError) {
    return (
      <DirectoryShell onRefresh={onRefresh} isRefreshing={isRefreshing}>
        <div className="text-xs space-y-1">
          <div className="text-terminal-orange">{">"} source fetch failed</div>
          <div className="text-terminal-dim">{">"} {sourceError}</div>
        </div>
      </DirectoryShell>
    );
  }

  // Empty — no chapter count available
  const effectiveTotal = totalChapters ?? (isOnShelf && downloaded > 0 ? downloaded : null);

  if (effectiveTotal == null || effectiveTotal === 0) {
    return (
      <DirectoryShell>
        <div className="text-xs text-terminal-dim">{">"} chapter count unknown (ongoing series)</div>
      </DirectoryShell>
    );
  }

  // Fallback generated list
  const totalPages = Math.ceil(effectiveTotal / PER_PAGE);
  const start = page * PER_PAGE + 1;
  const end = Math.min((page + 1) * PER_PAGE, effectiveTotal);

  return (
    <DirectoryShell entryCount={effectiveTotal} cached={isOnShelf && downloaded > 0 ? downloaded : undefined}>
      <div className="space-y-0">
        {Array.from({ length: end - start + 1 }, (_, i) => {
          const chapterNum = start + i;
          return (
            <ChapterRow
              key={chapterNum}
              chapterNum={chapterNum}
              label={`Chapter ${String(chapterNum).padStart(3, "0")}`}
              {...sharedRowProps}
            />
          );
        })}
      </div>

      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </DirectoryShell>
  );
}
