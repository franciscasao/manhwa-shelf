/**
 * Extension source system types.
 *
 * Inspired by Tachiyomi/Suwayomi's extension architecture, each scraping
 * target (Webtoons, Tapas, etc.) implements the `Source` interface to
 * provide a uniform API for fetching chapter lists and page images.
 */

/**
 * Identifies a manga/manhwa series on a specific source.
 * Returned by `Source.parseUrl()` when it recognizes a URL.
 */
export interface SourceIdentifier {
  /** Source ID that recognized this URL (e.g., "webtoons", "tapas") */
  sourceId: string;
  /** Source-specific series identifier (e.g., "3162:webtoon" for Webtoons) */
  seriesId: string;
  /** The original URL that was parsed */
  url: string;
}

/**
 * A chapter/episode from a source.
 */
export interface SourceChapter {
  /** Unique chapter ID within the source (e.g., episode ID) */
  id: string;
  /** Chapter/episode number (1-based) */
  number: number;
  /** Episode/chapter title */
  title: string;
  /** Absolute URL to the chapter viewer page */
  url: string;
  /** Publish date as Unix timestamp in ms, or null if unknown */
  datePublished: number | null;
  /** Whether this chapter requires payment/unlock */
  isLocked?: boolean;
}

/**
 * A single page/image within a chapter.
 */
export interface SourcePage {
  /** Direct image URL */
  url: string;
  /** Optional per-page header overrides (merged with Source.imageHeaders) */
  headers?: Record<string, string>;
}

/**
 * Manga/manhwa details fetched directly from a source.
 * Optional capability — AniList is the primary metadata source.
 */
export interface SourceMangaDetails {
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  genres: string[];
  status: "ongoing" | "completed" | "hiatus" | "unknown";
}

/**
 * Extension source interface.
 *
 * Each scraping target implements this to provide chapter list fetching,
 * page image extraction, and URL identification. Server-side only — these
 * methods make external HTTP requests that require proper headers.
 *
 * To add a new source:
 * 1. Create a folder under `src/extensions/<source-name>/`
 * 2. Implement the `Source` interface in `index.ts`
 * 3. Call `registerSource()` at module scope
 * 4. Import the module in `src/extensions/index.ts`
 */
export interface Source {
  /** Unique identifier (e.g., "webtoons", "tapas") */
  readonly id: string;

  /** Human-readable display name */
  readonly name: string;

  /** Base URL of the source website */
  readonly baseUrl: string;

  /** Default headers for fetching HTML/API content from this source */
  readonly headers: Record<string, string>;

  /** Headers for fetching images (used by the image proxy) */
  readonly imageHeaders: Record<string, string>;

  /** Allowed image hosting domains for proxy validation */
  readonly imageDomains: string[];

  /**
   * Attempt to parse a URL and identify it as belonging to this source.
   * Returns null if the URL doesn't match this source.
   */
  parseUrl(url: string): SourceIdentifier | null;

  /**
   * Fetch all chapters for a series, ordered oldest-first.
   * Handles pagination internally.
   */
  fetchChapterList(seriesId: string): Promise<SourceChapter[]>;

  /**
   * Fetch all page image URLs for a specific chapter.
   * @param chapterUrl - Absolute URL to the chapter viewer page
   */
  fetchChapterPages(chapterUrl: string): Promise<SourcePage[]>;

  /**
   * Optional: fetch manga/manhwa details directly from the source.
   * Useful when AniList doesn't have sufficient info.
   */
  fetchMangaDetails?(seriesId: string): Promise<SourceMangaDetails>;
}
