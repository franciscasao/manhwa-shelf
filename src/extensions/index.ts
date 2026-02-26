/**
 * Extension system public API.
 *
 * Importing this module auto-registers all built-in source extensions.
 *
 * Usage:
 *   import { getSource, identifySource, findSourceLink } from "@/extensions";
 *
 *   // Identify a source from a URL
 *   const id = identifySource("https://www.webtoons.com/en/.../list?title_no=123");
 *   // => { sourceId: "webtoons", seriesId: "123:webtoon", url: "..." }
 *
 *   // Get a source and fetch chapters
 *   const source = getSource("webtoons")!;
 *   const chapters = await source.fetchChapterList("123:webtoon");
 *
 *   // Find a source from AniList external links
 *   const link = findSourceLink(media.externalLinks);
 *   if (link) {
 *     const src = getSource(link.sourceId)!;
 *     const chapters = await src.fetchChapterList(link.seriesId);
 *   }
 */

// Re-export types
export type {
  Source,
  SourceIdentifier,
  SourceChapter,
  SourcePage,
  SourceMangaDetails,
} from "./types";

// Re-export registry
export {
  registerSource,
  getSource,
  getAllSources,
  identifySource,
  validateImageDomain,
  findSourceLink,
} from "./registry";

// Import extensions to trigger auto-registration
import "./webtoons";
import "./tapas";
