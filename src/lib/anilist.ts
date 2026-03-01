import { Manga, MangaOrigin } from "@/lib/types";
import { toPocketBaseId } from "@/lib/manga-utils";

export interface AniListMedia {
  id: number;
  title: {
    english: string | null;
    romaji: string;
  };
  coverImage: {
    large: string;
  };
  genres: string[];
  averageScore: number | null;
  chapters: number | null;
  countryOfOrigin: string | null;
  staff: {
    nodes: { name: { full: string } }[];
    edges: { role: string; node: { name: { full: string } } }[];
  };
  isAdult: boolean;
}

export interface AniListExternalLink {
  url: string;
  site: string;
  type: string | null;
  language: string | null;
  icon: string | null;
  color: string | null;
}

/** Filter external links to only English (or null-language), non-social links. */
export function getEnglishLinks(links: AniListExternalLink[] | null | undefined): AniListExternalLink[] {
  if (!links) return [];
  return links.filter((link) => (link.language === "English" || link.language === null) && link.type !== "SOCIAL");
}

export interface AniListMediaDetail extends AniListMedia {
  description: string | null;
  bannerImage: string | null;
  tags: { name: string; rank: number }[];
  popularity: number | null;
  favourites: number | null;
  status: string | null;
  volumes: number | null;
  startDate: { year: number | null; month: number | null; day: number | null } | null;
  endDate: { year: number | null; month: number | null; day: number | null } | null;
  source: string | null;
  externalLinks: AniListExternalLink[] | null;
  relations: {
    edges: {
      relationType: string;
      node: {
        id: number;
        title: { english: string | null; romaji: string };
        format: string | null;
        coverImage: { large: string };
        type: string;
      };
    }[];
  } | null;
}

export interface PageInfo {
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
  total: number;
}

export interface SearchResult {
  media: AniListMedia[];
  pageInfo: PageInfo;
}

export function mapAniListToManga(media: AniListMedia, origin?: MangaOrigin): Manga {
  const resolvedOrigin: MangaOrigin = origin ?? (media.countryOfOrigin as MangaOrigin) ?? "KR";
  const storyEdge = media.staff.edges.find((e) => e.role === "Story" || e.role === "Story & Art");
  const author = storyEdge?.node.name.full ?? media.staff.nodes[0]?.name.full ?? "Unknown";

  return {
    id: toPocketBaseId(media.id),
    title: media.title.english ?? media.title.romaji,
    author,
    coverImage: media.coverImage.large,
    genres: media.genres,
    rating: media.averageScore != null ? media.averageScore / 10 : 0,
    chapters: {
      downloaded: 0,
      total: media.chapters ?? null,
    },
    sizeOnDisk: "0 MB",
    lastUpdated: "",
    origin: resolvedOrigin,
  };
}
