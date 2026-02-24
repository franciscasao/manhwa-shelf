export type DownloadStatus = "complete" | "partial" | "queued" | "not-downloaded";

export type ChapterDownloadState = "idle" | "fetching-pages" | "downloading" | "zipping" | "uploading" | "complete" | "error";

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
  viewerLink: string;
}

export type DownloadStreamEvent =
  | { type: "pages"; total: number }
  | { type: "progress"; downloaded: number; total: number }
  | { type: "uploading" }
  | { type: "complete"; recordId: string; sizeBytes: number }
  | { type: "error"; message: string };

export type MangaOrigin = "JP" | "KR";
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
