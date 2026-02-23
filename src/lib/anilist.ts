import { Manga } from "@/lib/types";

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
  staff: {
    nodes: { name: { full: string } }[];
    edges: { role: string; node: { name: { full: string } } }[];
  };
}

const SEARCH_QUERY = `
  query SearchManhwa($search: String!, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(search: $search, format: MANGA, countryOfOrigin: "KR", sort: SEARCH_MATCH) {
        id
        title { english romaji }
        coverImage { large }
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

export async function searchManhwa(
  query: string,
  page = 1,
  perPage = 20,
): Promise<AniListMedia[]> {
  const res = await fetch("/api/anilist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: SEARCH_QUERY,
      variables: { search: query, page, perPage },
    }),
  });

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }

  const json = await res.json();
  return json.data?.Page?.media ?? [];
}

export function mapAniListToManga(media: AniListMedia): Manga {
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
  };
}
