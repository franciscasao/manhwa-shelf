import { Manga, MangaOrigin, SearchOrigin } from "@/lib/types";

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

const SEARCH_QUERY = `
  query SearchMedia($search: String!, $countryOfOrigin: CountryCode, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(search: $search, format: MANGA, countryOfOrigin: $countryOfOrigin, sort: SEARCH_MATCH) {
        id
        title { english romaji }
        coverImage { large }
        countryOfOrigin
        genres
        averageScore
        chapters
        staff(sort: RELEVANCE) {
          nodes { name { full } }
          edges { role node { name { full } } }
        }
      }
    }
  }
`;

export async function searchMedia(
  query: string,
  origin: SearchOrigin = "KR",
  page = 1,
  perPage = 20,
): Promise<AniListMedia[]> {
  const variables: Record<string, unknown> = { search: query, page, perPage };
  if (origin !== "ALL") {
    variables.countryOfOrigin = origin;
  }

  const res = await fetch("/api/anilist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: SEARCH_QUERY,
      variables,
    }),
  });

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }

  const json = await res.json();
  return json.data?.Page?.media ?? [];
}

export async function searchManhwa(
  query: string,
  page = 1,
  perPage = 20,
): Promise<AniListMedia[]> {
  return searchMedia(query, "KR", page, perPage);
}

const DETAIL_QUERY = `
  query GetMedia($id: Int!) {
    Media(id: $id, type: MANGA) {
      id
      title { english romaji }
      coverImage { large }
      bannerImage
      countryOfOrigin
      genres
      tags { name rank }
      averageScore
      popularity
      favourites
      chapters
      volumes
      status
      description(asHtml: false)
      source
      startDate { year month day }
      endDate { year month day }
      staff(sort: RELEVANCE) {
        nodes { name { full } }
        edges { role node { name { full } } }
      }
      relations {
        edges {
          relationType
          node {
            id
            title { english romaji }
            format
            coverImage { large }
            type
          }
        }
      }
    }
  }
`;

export async function fetchManhwaById(id: number): Promise<AniListMediaDetail> {
  const res = await fetch("/api/anilist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: DETAIL_QUERY,
      variables: { id },
    }),
  });

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status}`);
  }

  const json = await res.json();
  const media = json.data?.Media;
  if (!media) throw new Error("Media not found");
  return media;
}

export function mapAniListToManga(media: AniListMedia, origin?: MangaOrigin): Manga {
  const resolvedOrigin: MangaOrigin =
    origin ?? (media.countryOfOrigin === "JP" ? "JP" : "KR");
  const storyEdge = media.staff.edges.find(
    (e) => e.role === "Story" || e.role === "Story & Art",
  );
  const author =
    storyEdge?.node.name.full ?? media.staff.nodes[0]?.name.full ?? "Unknown";

  return {
    id: String(media.id),
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
