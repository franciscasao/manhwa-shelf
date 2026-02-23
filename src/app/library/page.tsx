"use client";

import { useState, useMemo } from "react";
import { useShelf } from "@/hooks/use-shelf";
import { Manga } from "@/lib/types";
import { getDownloadStatus } from "@/lib/manga-utils";
import { LibraryStatsBar } from "@/components/library/library-stats-bar";
import { LibraryToolbar } from "@/components/library/library-toolbar";
import { LibraryTerminalCard } from "@/components/library/library-terminal-card";
import { LibraryListRow } from "@/components/library/library-list-row";
import { LibraryEmptyState } from "@/components/library/library-empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type FilterValue = "all" | "complete" | "partial" | "not-downloaded";
type SortValue = "title" | "rating" | "chapters" | "size" | "updated";
type ViewMode = "grid" | "list";

function parseSizeGB(sizeStr: string): number {
  const match = sizeStr.match(/([\d.]+)\s*(GB|MB)/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  return match[2].toUpperCase() === "GB" ? val : val / 1024;
}

function sortManga(manga: Manga[], sortBy: SortValue): Manga[] {
  const sorted = [...manga];
  switch (sortBy) {
    case "title":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "chapters":
      return sorted.sort(
        (a, b) => b.chapters.downloaded - a.chapters.downloaded,
      );
    case "size":
      return sorted.sort(
        (a, b) => parseSizeGB(b.sizeOnDisk) - parseSizeGB(a.sizeOnDisk),
      );
    case "updated":
      return sorted.sort((a, b) =>
        (b.lastUpdated || "").localeCompare(a.lastUpdated || ""),
      );
    default:
      return sorted;
  }
}

export default function LibraryPage() {
  const { shelf, isHydrated, removeFromShelf } = useShelf();
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [sortBy, setSortBy] = useState<SortValue>("title");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  // Compute stats
  const stats = useMemo(() => {
    const completeCount = shelf.filter(
      (m) => getDownloadStatus(m) === "complete",
    ).length;
    const partialCount = shelf.filter(
      (m) => getDownloadStatus(m) === "partial",
    ).length;
    const noneCount = shelf.filter(
      (m) => getDownloadStatus(m) === "not-downloaded",
    ).length;
    const totalChapters = shelf.reduce((s, m) => s + m.chapters.downloaded, 0);
    const totalSizeGB = shelf.reduce(
      (s, m) => s + parseSizeGB(m.sizeOnDisk),
      0,
    );
    return {
      completeCount,
      partialCount,
      noneCount,
      totalChapters,
      totalSizeGB,
    };
  }, [shelf]);

  // Data pipeline: filter by status → search → sort
  const filteredManga = useMemo(() => {
    let result = shelf;

    // Filter by status
    if (activeFilter !== "all") {
      result = result.filter((m) => getDownloadStatus(m) === activeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.author.toLowerCase().includes(q),
      );
    }

    // Sort
    return sortManga(result, sortBy);
  }, [shelf, activeFilter, searchQuery, sortBy]);

  const counts = {
    all: shelf.length,
    complete: stats.completeCount,
    partial: stats.partialCount,
    none: stats.noneCount,
  };

  const filterFlag =
    activeFilter === "all"
      ? "--all"
      : activeFilter === "complete"
        ? "--complete"
        : activeFilter === "partial"
          ? "--partial"
          : "--none";

  const confirmTarget = shelf.find((m) => m.id === confirmRemoveId);

  const handleRemove = (id: string) => {
    setConfirmRemoveId(id);
  };

  const confirmRemove = () => {
    if (confirmRemoveId) {
      removeFromShelf(confirmRemoveId);
      setConfirmRemoveId(null);
    }
  };

  return (
    <div className="font-mono relative min-h-screen overflow-hidden bg-terminal-bg text-terminal-green">
      {/* CRT scanline overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px] animate-[flicker_4s_infinite] px-3 py-6 md:px-8 md:py-10">
        {/* Stats bar */}
        <LibraryStatsBar
          totalTitles={shelf.length}
          totalChapters={stats.totalChapters}
          totalSizeGB={stats.totalSizeGB}
          completeCount={stats.completeCount}
          partialCount={stats.partialCount}
          noneCount={stats.noneCount}
          isHydrated={isHydrated}
        />

        {/* Boot sequence */}
        <div className="mb-4 text-xs text-terminal-muted">
          <div>{">"} mounting local shelf archive...</div>
          <div>
            {">"} indexing {isHydrated ? shelf.length : "—"} titles...
          </div>
          <div className="text-terminal-green">{">"} file manager ready.</div>
        </div>

        {/* Toolbar */}
        <LibraryToolbar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          counts={counts}
        />

        {/* Results header line */}
        <div className="mb-3 text-[0.65rem] font-mono text-terminal-dim border-b border-terminal-border pb-2">
          <span className="text-terminal-green">{">"}</span> listing{" "}
          <span className="text-white">{filteredManga.length}</span> of{" "}
          <span className="text-white">{shelf.length}</span> titles
          <span className="text-terminal-muted mx-2">|</span>
          filter: {filterFlag}
          <span className="text-terminal-muted mx-2">|</span>
          sort: --{sortBy}
          <span className="text-terminal-muted mx-2">|</span>
          view: {viewMode}
        </div>

        {/* Content area */}
        {!isHydrated ? (
          /* Skeleton loading */
          <div className="space-y-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border border-terminal-border/30 px-3 py-2"
                style={{ opacity: 1 - i * 0.12 }}
              >
                <div className="h-[38px] w-[28px] shrink-0 bg-terminal-border/30 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div
                    className="h-2 bg-terminal-border/40 animate-pulse"
                    style={{ width: `${60 + (i % 3) * 15}%` }}
                  />
                  <div
                    className="h-1.5 bg-terminal-border/20 animate-pulse"
                    style={{ width: `${30 + (i % 4) * 10}%` }}
                  />
                </div>
                <div className="text-[0.6rem] text-terminal-muted shrink-0">
                  loading...
                </div>
              </div>
            ))}
          </div>
        ) : shelf.length === 0 ? (
          <LibraryEmptyState mode="empty" />
        ) : filteredManga.length === 0 ? (
          <LibraryEmptyState
            mode="no-matches"
            searchQuery={searchQuery}
            activeFilter={filterFlag}
          />
        ) : (
          <div
            key={`${viewMode}-${activeFilter}-${searchQuery}-${sortBy}`}
            className="view-fade"
          >
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredManga.map((manga, index) => (
                  <LibraryTerminalCard
                    key={manga.id}
                    manga={manga}
                    index={index}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredManga.map((manga, index) => (
                  <LibraryListRow
                    key={manga.id}
                    manga={manga}
                    index={index}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Remove confirmation dialog */}
        <Dialog
          open={confirmRemoveId !== null}
          onOpenChange={(open) => !open && setConfirmRemoveId(null)}
        >
          <DialogContent className="border-terminal-border bg-terminal-bg font-mono sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-terminal-orange text-sm">
                {">"} CONFIRM REMOVAL
              </DialogTitle>
              <DialogDescription className="text-terminal-dim text-xs">
                Remove{" "}
                <span className="text-terminal-cyan">
                  {confirmTarget?.title}
                </span>{" "}
                from your local shelf archive? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <button
                onClick={() => setConfirmRemoveId(null)}
                className="border border-terminal-border px-4 py-1.5 text-xs text-terminal-dim hover:text-terminal-green transition-colors"
              >
                [ CANCEL ]
              </button>
              <button
                onClick={confirmRemove}
                className="border border-red-500/50 px-4 py-1.5 text-xs text-red-500 hover:bg-red-500/10 transition-colors"
              >
                [ REMOVE ]
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Footer status bar */}
        <div className="mt-6 border-t border-terminal-border pt-4 text-xs text-terminal-muted">
          <div className="flex flex-col gap-1 md:flex-row md:justify-between">
            <span>
              <span className="text-terminal-dim">{"["}</span>
              <span className="text-terminal-green">OK</span>
              <span className="text-terminal-dim">{"]"}</span> file-manager v2.0
              <span className="text-terminal-muted"> | </span>
              showing {filteredManga.length}/{shelf.length} titles
              <span className="text-terminal-muted"> | </span>
              {stats.totalSizeGB.toFixed(1)} GB indexed
            </span>
            <span>
              <span className="text-terminal-green">
                ready<span className="blink-cursor">_</span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
