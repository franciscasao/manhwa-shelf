import type { Source, SourceIdentifier, SourceChapter, SourcePage, SourceMangaDetails } from "../types";
import { registerSource } from "../registry";

/**
 * ManhwaClan (manhwaclan.com) extension.
 *
 * Madara-based WordPress manga/manhwa site. Chapter list is fetched via
 * a two-step approach: GET the manga page for the WordPress post ID, then
 * POST to admin-ajax.php for the full chapter list.
 *
 * @see https://github.com/keiyoushi/extensions-source — Madara source pattern
 */

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:105.0) Gecko/20100101 Firefox/105.0";

const MANHWACLAN_HEADERS: Record<string, string> = {
  "User-Agent": USER_AGENT,
  Referer: "https://manhwaclan.com/",
};

// -- HTML parsing helpers (regex-based, no DOM dependency) --

function extractAttr(tag: string, attr: string): string | null {
  const match = tag.match(new RegExp(`${attr}=["']([^"']+)["']`));
  return match?.[1] ?? null;
}

function selectAll(html: string, pattern: RegExp): string[] {
  const matches: string[] = [];
  let m;
  while ((m = pattern.exec(html)) !== null) {
    matches.push(m[0]);
  }
  return matches;
}

function selectText(html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  if (!match) return "";
  return match[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
}

/**
 * Parse Madara-style relative dates ("X days ago", "2 hours ago", etc.)
 * into Unix timestamps. Falls back to `new Date()` for standard date strings.
 */
function parseRelativeDate(text: string): number | null {
  const trimmed = text.trim().toLowerCase();

  const agoMatch = trimmed.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/);
  if (agoMatch) {
    const amount = parseInt(agoMatch[1], 10);
    const unit = agoMatch[2];
    const now = Date.now();
    const ms: Record<string, number> = {
      second: 1000,
      minute: 60_000,
      hour: 3_600_000,
      day: 86_400_000,
      week: 604_800_000,
      month: 2_592_000_000,
      year: 31_536_000_000,
    };
    return now - amount * (ms[unit] ?? 0);
  }

  // Try standard date parsing
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) return parsed.getTime();

  return null;
}

const manhwaclan: Source = {
  id: "manhwaclan",
  name: "ManhwaClan",
  baseUrl: "https://manhwaclan.com",

  headers: MANHWACLAN_HEADERS,

  imageHeaders: {
    "User-Agent": USER_AGENT,
    Referer: "https://manhwaclan.com/",
  },

  imageDomains: ["manhwaclan.com"],

  parseUrl(url: string): SourceIdentifier | null {
    try {
      const parsed = new URL(url);
      if (parsed.hostname !== "manhwaclan.com" && parsed.hostname !== "www.manhwaclan.com") {
        return null;
      }

      // Match /manga/<slug>
      const match = parsed.pathname.match(/\/manga\/([^/]+)/);
      if (!match) return null;

      return {
        sourceId: this.id,
        seriesId: match[1],
        url,
      };
    } catch {
      return null;
    }
  },

  async fetchChapterList(seriesId: string): Promise<SourceChapter[]> {
    // Step 1: GET manga page to extract WordPress post ID
    const mangaUrl = `${this.baseUrl}/manga/${seriesId}/`;
    const pageRes = await fetch(mangaUrl, { headers: this.headers });

    if (!pageRes.ok) {
      throw new Error(`ManhwaClan manga page returned ${pageRes.status}`);
    }

    const pageHtml = await pageRes.text();

    // Extract post ID from <input id="manga-chapters-holder" data-id="...">
    const postIdMatch = pageHtml.match(/id="manga-chapters-holder"[^>]*data-id="(\d+)"/);
    if (!postIdMatch) {
      throw new Error("Could not find manga post ID — page structure may have changed");
    }
    const postId = postIdMatch[1];

    // Step 2: POST to admin-ajax.php for full chapter list
    const ajaxRes = await fetch(`${this.baseUrl}/wp-admin/admin-ajax.php`, {
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `action=manga_get_chapters&manga=${postId}`,
    });

    if (!ajaxRes.ok) {
      throw new Error(`ManhwaClan chapter list API returned ${ajaxRes.status}`);
    }

    const chapterHtml = await ajaxRes.text();

    // Parse chapter list items: <li class="wp-manga-chapter">
    const chapterItems = selectAll(chapterHtml, /<li[^>]*class="[^"]*wp-manga-chapter[^"]*"[^>]*>[\s\S]*?<\/li>/gi);

    const chapters: SourceChapter[] = [];

    for (const item of chapterItems) {
      // Extract chapter link: <a href="...">Chapter Title</a>
      const linkMatch = item.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/);
      if (!linkMatch) continue;

      const chapterUrl = linkMatch[1].trim();
      const rawTitle = linkMatch[2].replace(/<[^>]+>/g, "").trim();

      // Extract chapter number from title (e.g., "Chapter 42", "Ch.42")
      const numMatch = rawTitle.match(/(?:chapter|ch\.?)\s*(\d+(?:\.\d+)?)/i);
      const chapterNumber = numMatch ? parseFloat(numMatch[1]) : chapters.length + 1;

      // Extract release date from <span class="chapter-release-date"><i>...</i></span>
      const dateMatch = item.match(/class="chapter-release-date"[^>]*>[\s\S]*?<i[^>]*>([\s\S]*?)<\/i>/);
      const dateText = dateMatch?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
      const datePublished = dateText ? parseRelativeDate(dateText) : null;

      // Use slug from URL as chapter ID
      const urlSlug = chapterUrl.replace(/\/$/, "").split("/").pop() ?? String(chapterNumber);

      chapters.push({
        id: urlSlug,
        number: chapterNumber,
        title: rawTitle,
        url: chapterUrl,
        datePublished,
      });
    }

    // Madara returns newest-first, reverse to oldest-first
    chapters.reverse();

    return chapters;
  },

  async fetchChapterPages(chapterUrl: string): Promise<SourcePage[]> {
    try {
      const parsed = new URL(chapterUrl);
      if (parsed.hostname !== "manhwaclan.com" && parsed.hostname !== "www.manhwaclan.com") {
        throw new Error("Invalid ManhwaClan URL domain");
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("ManhwaClan")) throw e;
      throw new Error("Invalid ManhwaClan chapter URL");
    }

    const res = await fetch(chapterUrl, { headers: this.headers });

    if (!res.ok) {
      throw new Error(`ManhwaClan chapter page returned ${res.status}`);
    }

    const html = await res.text();

    // Primary: <img class="wp-manga-chapter-img" ...>
    let imgTags = selectAll(html, /<img[^>]+class=["'][^"']*wp-manga-chapter-img[^"']*["'][^>]*>/gi);

    // Fallback: images inside <div class="page-break"> containers
    if (imgTags.length === 0) {
      imgTags = selectAll(html, /<div[^>]+class=["'][^"']*page-break[^"']*["'][^>]*>[\s\S]*?<img[^>]*>/gi);
      // Extract just the <img> tag from the div wrapper
      imgTags = imgTags
        .map((div) => {
          const imgMatch = div.match(/<img[^>]*>/);
          return imgMatch?.[0] ?? "";
        })
        .filter(Boolean);
    }

    const pages: SourcePage[] = [];

    for (const tag of imgTags) {
      // Prefer data-src (lazy-loaded), fall back to src
      const rawUrl = extractAttr(tag, "data-src") ?? extractAttr(tag, "src");
      if (!rawUrl) continue;

      const url = rawUrl.trim();
      if (!url) continue;

      // Resolve relative URLs
      const absoluteUrl = url.startsWith("/") ? `${this.baseUrl}${url}` : url;

      pages.push({ url: absoluteUrl });
    }

    if (pages.length === 0) {
      throw new Error("No images found — chapter may be unavailable");
    }

    return pages;
  },

  async fetchMangaDetails(seriesId: string): Promise<SourceMangaDetails> {
    const url = `${this.baseUrl}/manga/${seriesId}/`;
    const res = await fetch(url, { headers: this.headers });

    if (!res.ok) {
      throw new Error(`ManhwaClan details page returned ${res.status}`);
    }

    const html = await res.text();

    // Title: <div class="post-title"><h1>...</h1></div>
    const title = selectText(html, /class="post-title"[^>]*>[\s\S]*?<h1[^>]*>([\s\S]*?)<\/h1>/);

    // Cover image: <div class="summary_image"><...><img src="..."></div>
    const coverMatch = html.match(/class="summary_image"[\s\S]*?<img[^>]+src=["']([^"']+)["']/);
    const coverUrl = coverMatch?.[1] ?? "";

    // Author: <div class="author-content"><a ...>Name</a></div>
    const author = selectText(html, /class="author-content"[^>]*>([\s\S]*?)<\/div>/) || "Unknown";

    // Genres: <div class="genres-content"><a ...>Genre</a>, ...</div>
    const genresHtml = html.match(/class="genres-content"[^>]*>([\s\S]*?)<\/div>/);
    const genres = genresHtml
      ? selectAll(genresHtml[1], /<a[^>]*>([^<]+)<\/a>/gi)
          .map((tag) => tag.replace(/<[^>]+>/g, "").trim())
          .filter(Boolean)
      : [];

    // Status: <div class="post-status">...<div class="summary-content">Ongoing</div></div>
    const statusText = selectText(html, /class="post-status"[\s\S]*?class="summary-content"[^>]*>([\s\S]*?)<\/div>/).toLowerCase();
    let status: SourceMangaDetails["status"] = "unknown";
    if (statusText.includes("ongoing")) status = "ongoing";
    else if (statusText.includes("completed")) status = "completed";
    else if (statusText.includes("hiatus") || statusText.includes("on hold")) status = "hiatus";

    // Description: <div class="description-summary"><div class="summary__content">...</div></div>
    const description = selectText(html, /class="summary__content"[^>]*>([\s\S]*?)<\/div>/);

    return { title, author, description, coverUrl, genres, status };
  },
};

registerSource(manhwaclan);
export default manhwaclan;
