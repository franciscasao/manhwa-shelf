export type DownloadStatus = "complete" | "partial" | "queued" | "not-downloaded";

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
