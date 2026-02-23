export type DownloadStatus = "complete" | "partial" | "queued" | "not-downloaded";

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
};
