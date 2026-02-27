export type DownloadStatus =
  | "complete"
  | "partial"
  | "queued"
  | "not-downloaded";

export type ChapterDownloadState =
  | "idle"
  | "fetching-pages"
  | "downloading"
  | "uploading"
  | "complete"
  | "error";

export interface ChapterProgress {
  chapterNum: number;
  state: ChapterDownloadState;
  imagesDownloaded: number;
  imagesTotal: number;
  error?: string;
}

export interface DownloadQueueItem {
  mangaId: string;
  chapterNum: number;
  episodeTitle: string;
  chapterUrl: string;
  sourceId: string;
}

export type DownloadStreamEvent =
  | { type: "pages"; total: number }
  | { type: "progress"; downloaded: number; total: number }
  | { type: "uploading" }
  | { type: "complete"; recordId: string; sizeBytes: number }
  | { type: "error"; message: string };

export interface ManagedChapterState {
  chapterNum: number;
  state: "queued" | "fetching-pages" | "downloading" | "uploading" | "complete" | "error";
  imagesDownloaded: number;
  imagesTotal: number;
  error?: string;
}

export interface MangaProgressSnapshot {
  mangaId: string;
  currentChapter: ManagedChapterState | null;
  queuedChapters: number[];
  completedChapters: number[];
  isProcessing: boolean;
}

export type SortValue = "title" | "rating" | "chapters" | "size" | "updated";
export type FilterValue = "all" | "complete" | "partial" | "not-downloaded";
export type ViewMode = "grid" | "list";

export type MangaOrigin = "JP" | "KR" | "CN" | "TW";
export type SearchOrigin = MangaOrigin | "ALL";

export type Manga = {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  genres: string[];
  rating: number;
  chapters: {
    downloaded: number;
    total: number | null;
  };
  sizeOnDisk: string;
  lastUpdated: string;
  origin: MangaOrigin;
};
