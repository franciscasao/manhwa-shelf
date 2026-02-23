import { Manga, DownloadStatus } from "@/lib/types";

export function getDownloadStatus(manga: Manga): DownloadStatus {
  if (manga.chapters.downloaded === 0) return "not-downloaded";
  if (manga.chapters.total && manga.chapters.downloaded >= manga.chapters.total)
    return "complete";
  return "partial";
}

export function getPercent(manga: Manga): number {
  const status = getDownloadStatus(manga);
  if (status === "not-downloaded") return 0;
  if (status === "complete") return 100;
  const total = manga.chapters.total ?? manga.chapters.downloaded;
  return total > 0 ? Math.round((manga.chapters.downloaded / total) * 100) : 0;
}

export const statusConfig: Record<
  DownloadStatus,
  {
    label: string;
    color: string;
    textClass: string;
    borderClass: string;
    progressClass: string;
  }
> = {
  complete: {
    label: "DONE",
    color: "terminal-green",
    textClass: "text-terminal-green",
    borderClass: "border-terminal-green",
    progressClass: "[&>[data-slot=progress-indicator]]:bg-terminal-green",
  },
  partial: {
    label: "SYNC",
    color: "terminal-cyan",
    textClass: "text-terminal-cyan",
    borderClass: "border-terminal-cyan",
    progressClass: "[&>[data-slot=progress-indicator]]:bg-terminal-cyan",
  },
  queued: {
    label: "WAIT",
    color: "terminal-orange",
    textClass: "text-terminal-orange",
    borderClass: "border-terminal-orange",
    progressClass: "[&>[data-slot=progress-indicator]]:bg-terminal-orange",
  },
  "not-downloaded": {
    label: "NONE",
    color: "terminal-dim",
    textClass: "text-terminal-dim",
    borderClass: "border-terminal-dim",
    progressClass: "[&>[data-slot=progress-indicator]]:bg-terminal-dim",
  },
};
