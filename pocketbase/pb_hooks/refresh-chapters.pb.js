/// <reference path="../pb_data/types.d.ts" />

/**
 * Cron job: Refresh chapter details for ongoing manga/manhwa.
 *
 * Runs daily at 00:00 (midnight). For each shelf entry that is still
 * releasing (status = "RELEASING") and has a linked source, it:
 *   1. Queries AniList to detect status changes and updated chapter counts.
 *   2. Calls the Next.js tRPC endpoint to refresh the chapter cache.
 *   3. Updates the shelf record with new chapter totals and status.
 */

const ANILIST_URL = "https://graphql.anilist.co";
const ANILIST_DETAIL_QUERY = `
  query GetMedia($id: Int!) {
    Media(id: $id, type: MANGA) {
      id
      status
      chapters
      externalLinks { url site type language }
    }
  }
`;

/**
 * Convert a 15-char zero-padded PocketBase ID back to an AniList integer ID.
 * e.g. "000000000123456" -> 123456
 */
function toAniListId(pbId) {
  return parseInt(pbId, 10);
}

/**
 * Fetch media details from AniList.
 */
function fetchAniListDetail(anilistId) {
  try {
    const res = $http.send({
      method: "POST",
      url: ANILIST_URL,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: ANILIST_DETAIL_QUERY,
        variables: { id: anilistId },
      }),
      timeout: 30,
    });

    if (res.statusCode !== 200) {
      console.log(
        "[refresh-chapters] AniList request failed for ID " +
          anilistId +
          ": HTTP " +
          res.statusCode
      );
      return null;
    }

    return res.json?.data?.Media || null;
  } catch (err) {
    console.log(
      "[refresh-chapters] AniList fetch error for ID " + anilistId + ": " + err
    );
    return null;
  }
}

/**
 * Call the Next.js tRPC source.refreshChapters mutation to refresh the
 * chapter cache for a given source + series.
 */
function refreshChapterCache(appUrl, sourceId, seriesId) {
  try {
    const res = $http.send({
      method: "POST",
      url: appUrl + "/api/trpc/source.refreshChapters",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { sourceId: sourceId, seriesId: seriesId } }),
      timeout: 60,
    });

    if (res.statusCode !== 200) {
      console.log(
        "[refresh-chapters] tRPC refresh failed for " +
          sourceId +
          ":" +
          seriesId +
          ": HTTP " +
          res.statusCode
      );
      return null;
    }

    // tRPC wraps the response in { result: { data: { json: [...] } } }
    const chapters = res.json?.result?.data?.json;
    return Array.isArray(chapters) ? chapters : null;
  } catch (err) {
    console.log(
      "[refresh-chapters] tRPC refresh error for " +
        sourceId +
        ":" +
        seriesId +
        ": " +
        err
    );
    return null;
  }
}

cronAdd("refreshOngoingChapters", "0 0 * * *", () => {
  console.log("[refresh-chapters] Starting daily chapter refresh...");

  // The Next.js app URL — defaults to localhost:3000 in development.
  // Override via PocketBase settings or environment as needed.
  const appUrl =
    $app.store().get("NEXT_APP_URL") || "http://localhost:3000";

  // Find all shelf entries that are ongoing and have source info.
  let records;
  try {
    records = $app.findRecordsByFilter(
      "shelf",
      'status = "RELEASING" && sourceId != "" && seriesId != ""',
      "-lastUpdated",
      500, // limit
      0 // offset
    );
  } catch (err) {
    console.log("[refresh-chapters] Failed to query shelf: " + err);
    return;
  }

  if (!records || records.length === 0) {
    console.log("[refresh-chapters] No ongoing manga to refresh.");
    return;
  }

  console.log(
    "[refresh-chapters] Found " + records.length + " ongoing entries to refresh."
  );

  let updated = 0;
  let errors = 0;

  for (const record of records) {
    const mangaId = record.id;
    const title = record.getString("title");
    const sourceId = record.getString("sourceId");
    const seriesId = record.getString("seriesId");
    const anilistId = toAniListId(mangaId);

    console.log(
      "[refresh-chapters] Refreshing: " + title + " (AniList #" + anilistId + ")"
    );

    // 1. Check AniList for status changes
    const anilistData = fetchAniListDetail(anilistId);

    let newStatus = record.getString("status");
    let newChapterTotal = null;

    if (anilistData) {
      // Update status if changed (e.g. RELEASING -> FINISHED)
      if (anilistData.status && anilistData.status !== newStatus) {
        console.log(
          "[refresh-chapters]   Status changed: " +
            newStatus +
            " -> " +
            anilistData.status
        );
        newStatus = anilistData.status;
      }

      // Update total chapters from AniList if available
      if (anilistData.chapters) {
        newChapterTotal = anilistData.chapters;
      }
    }

    // 2. Refresh chapter cache via tRPC
    const chapters = refreshChapterCache(appUrl, sourceId, seriesId);
    if (chapters && chapters.length > 0) {
      // Use source chapter count if AniList doesn't have it
      if (!newChapterTotal) {
        newChapterTotal = chapters.length;
      }
    }

    // 3. Update the shelf record
    try {
      const currentChapters = record.get("chapters") || {
        downloaded: 0,
        total: null,
      };

      const updatedChapters = {
        downloaded: currentChapters.downloaded || 0,
        total: newChapterTotal || currentChapters.total,
      };

      record.set("status", newStatus);
      record.set("chapters", updatedChapters);
      record.set("lastUpdated", new Date().toISOString());

      $app.save(record);
      updated++;

      console.log(
        "[refresh-chapters]   Updated: " +
          title +
          " (chapters: " +
          updatedChapters.total +
          ", status: " +
          newStatus +
          ")"
      );
    } catch (err) {
      errors++;
      console.log(
        "[refresh-chapters]   Failed to update " + title + ": " + err
      );
    }

    // Rate limit: small delay between requests to avoid hammering APIs
    // PocketBase JSVM doesn't have setTimeout, but a small HTTP call acts as a pause
  }

  console.log(
    "[refresh-chapters] Done. Updated: " +
      updated +
      ", Errors: " +
      errors +
      ", Total: " +
      records.length
  );
});
