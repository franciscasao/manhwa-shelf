import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import type { AniListMedia, AniListMediaDetail, SearchResult } from "@/lib/anilist";

const SEARCH_QUERY = `
  query SearchMedia($search: String!, $countryOfOrigin: CountryCode, $page: Int, $perPage: Int, $isAdult: Boolean) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage lastPage hasNextPage total }
      media(search: $search, format: MANGA, countryOfOrigin: $countryOfOrigin, isAdult: $isAdult, sort: SEARCH_MATCH) {
        id
        title { english romaji }
        coverImage { large }
        countryOfOrigin
        genres
        averageScore
        chapters
        isAdult
        staff(sort: RELEVANCE) {
          nodes { name { full } }
          edges { role node { name { full } } }
        }
      }
    }
  }
`;

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
      externalLinks { url site type language icon color }
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

async function queryAniList(query: string, variables: Record<string, unknown>) {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`AniList request failed: ${res.status}`);
  }
  return res.json();
}

export const anilistRouter = createTRPCRouter({
  search: baseProcedure
    .input(
      z.object({
        query: z.string().min(1),
        origin: z.enum(["JP", "KR", "CN", "TW", "ALL"]).default("KR"),
        page: z.number().int().positive().default(1),
        perPage: z.number().int().positive().max(50).default(20),
        isAdult: z.boolean().default(false),
      }),
    )
    .query(async ({ input }): Promise<SearchResult> => {
      const variables: Record<string, unknown> = {
        search: input.query,
        page: input.page,
        perPage: input.perPage,
        isAdult: input.isAdult,
      };
      if (input.origin !== "ALL") {
        variables.countryOfOrigin = input.origin;
      }

      const json = await queryAniList(SEARCH_QUERY, variables);
      const pageData = json.data?.Page;
      const rawPageInfo = pageData?.pageInfo;

      return {
        media: (pageData?.media ?? []) as AniListMedia[],
        pageInfo: {
          currentPage: rawPageInfo?.currentPage ?? input.page,
          lastPage: rawPageInfo?.lastPage ?? 1,
          hasNextPage: rawPageInfo?.hasNextPage ?? false,
          total: rawPageInfo?.total ?? 0,
        },
      };
    }),

  fetchById: baseProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }): Promise<AniListMediaDetail> => {
      const json = await queryAniList(DETAIL_QUERY, { id: input.id });
      const media = json.data?.Media;
      if (!media) throw new Error("Media not found");
      return media as AniListMediaDetail;
    }),
});
