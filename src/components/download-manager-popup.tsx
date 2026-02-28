"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Download, X } from "lucide-react";
import { useAllDownloads } from "@/hooks/use-all-downloads";
import type { MangaProgressSnapshot, ManagedChapterState } from "@/lib/types";

function getStateLabel(state: ManagedChapterState["state"]): string {
  switch (state) {
    case "fetching-pages":
      return "SCAN";
    case "downloading":
      return "SYNC";
    case "uploading":
      return "UPLOAD";
    case "error":
      return "ERR";
    default:
      return "";
  }
}

function getStateColor(state: ManagedChapterState["state"]): string {
  switch (state) {
    case "fetching-pages":
    case "uploading":
      return "text-terminal-cyan";
    case "downloading":
      return "text-terminal-orange";
    case "error":
      return "text-red-400";
    default:
      return "text-terminal-dim";
  }
}

function buildProgressBar(state: ManagedChapterState): string {
  const filled = "\u2588";
  const empty = "\u2591";
  const scanning = "\u2593";
  const width = 8;

  switch (state.state) {
    case "fetching-pages":
      return scanning.repeat(2) + empty.repeat(width - 2);
    case "downloading": {
      const ratio = state.imagesTotal > 0 ? state.imagesDownloaded / state.imagesTotal : 0;
      const filledCount = Math.round(ratio * width);
      return filled.repeat(filledCount) + empty.repeat(width - filledCount);
    }
    case "uploading":
      return filled.repeat(width - 1) + scanning;
    case "error":
      return empty.repeat(width);
    case "complete":
      return filled.repeat(width);
    default:
      return empty.repeat(width);
  }
}

function MangaEntry({
  snapshot,
  onCancel,
}: {
  snapshot: MangaProgressSnapshot;
  onCancel: (mangaId: string) => void;
}) {
  const { currentChapter } = snapshot;
  const totalChapters =
    snapshot.queuedChapters.length +
    snapshot.completedChapters.length +
    (currentChapter ? 1 : 0);

  return (
    <div className="border-t border-terminal-border px-3 py-2.5 first:border-t-0">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-mono text-xs font-bold text-terminal-green">
          {snapshot.mangaTitle || snapshot.mangaId}
        </span>
        <button
          onClick={() => onCancel(snapshot.mangaId)}
          className="shrink-0 cursor-pointer font-mono text-[10px] text-red-400 transition-colors hover:text-red-300"
        >
          [ CANCEL ]
        </button>
      </div>

      {currentChapter && (
        <div className="mt-1.5 flex items-center gap-2 font-mono text-[11px]">
          <span className={getStateColor(currentChapter.state)}>
            {getStateLabel(currentChapter.state)}
          </span>
          <span className="text-terminal-cyan">{buildProgressBar(currentChapter)}</span>
          <span className="text-terminal-dim">
            Ch.{currentChapter.chapterNum}
            {currentChapter.state === "downloading" &&
              currentChapter.imagesTotal > 0 &&
              ` ${currentChapter.imagesDownloaded}/${currentChapter.imagesTotal}`}
          </span>
        </div>
      )}

      <div className="mt-1 font-mono text-[10px] text-terminal-dim">
        {snapshot.completedChapters.length}/{totalChapters} chapters
        {snapshot.queuedChapters.length > 0 && (
          <span> | {snapshot.queuedChapters.length} queued</span>
        )}
      </div>
    </div>
  );
}

export function DownloadManagerPopup() {
  const { snapshots, activeCount, isActive, cancelManga } = useAllDownloads();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      panelRef.current &&
      !panelRef.current.contains(e.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  // Close panel when no more active downloads
  useEffect(() => {
    if (!isActive) {
      setIsOpen(false);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <>
      {/* Trigger button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed right-6 bottom-6 z-50 flex cursor-pointer items-center gap-2 rounded border border-terminal-border bg-terminal-bg px-3 py-2 font-mono text-xs text-terminal-green shadow-lg transition-colors hover:border-terminal-green/50"
      >
        <Download className="h-3.5 w-3.5" />
        <span>{activeCount}</span>
        <span className="blink-cursor">_</span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed right-6 bottom-16 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded border border-terminal-border bg-terminal-bg shadow-xl"
          style={{ animation: "panel-slide-up 0.2s ease-out" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-terminal-border px-3 py-2">
            <span className="font-mono text-[11px] text-terminal-dim">
              --- DOWNLOAD MANAGER ---
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="cursor-pointer text-terminal-dim transition-colors hover:text-terminal-green"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Scrollable list */}
          <div className="max-h-[320px] overflow-y-auto">
            {snapshots.map((snapshot) => (
              <MangaEntry
                key={snapshot.mangaId}
                snapshot={snapshot}
                onCancel={cancelManga}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
