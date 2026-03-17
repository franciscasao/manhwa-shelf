import { getServerPB } from "@/lib/db-server";
import { getSource, getAllSources } from "@/extensions";
import { downloadManager } from "@/lib/download-manager";
import type { SourceChapter } from "@/extensions/types";

const CHAPTERS_PER_SOURCE = 40;
const CRON_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours

let cronTimer: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

interface ShelfEntry {
  id: string;
  title: string;
  sourceId: string;
  seriesId: string;
}

/**
 * Run the cron download job: for each source, download up to 40
 * not-yet-downloaded chapters across all shelf entries linked to that source.
 */
export async function runCronDownload(): Promise<{
  enqueued: number;
  sources: Record<string, number>;
  errors: string[];
}> {
  if (isRunning) {
    return { enqueued: 0, sources: {}, errors: ["Cron job already running"] };
  }

  isRunning = true;
  const result: { enqueued: number; sources: Record<string, number>; errors: string[] } = {
    enqueued: 0,
    sources: {},
    errors: [],
  };

  try {
    const pb = await getServerPB();

    // Get all shelf entries that have a linked source
    const shelfRecords = await pb.collection("shelf").getFullList({
      filter: 'sourceId != "" && seriesId != ""',
    });

    const entries: ShelfEntry[] = shelfRecords.map((r) => ({
      id: r.id as string,
      title: r["title"] as string,
      sourceId: r["sourceId"] as string,
      seriesId: r["seriesId"] as string,
    }));

    if (entries.length === 0) {
      console.log("[cron] No shelf entries with linked sources found");
      return result;
    }

    // Group shelf entries by sourceId
    const bySource = new Map<string, ShelfEntry[]>();
    for (const entry of entries) {
      const list = bySource.get(entry.sourceId) ?? [];
      list.push(entry);
      bySource.set(entry.sourceId, list);
    }

    // For each source, find undownloaded chapters and enqueue up to CHAPTERS_PER_SOURCE
    for (const [sourceId, sourceEntries] of bySource) {
      const source = getSource(sourceId);
      if (!source) {
        result.errors.push(`Unknown source: ${sourceId}`);
        continue;
      }

      let sourceEnqueued = 0;

      for (const entry of sourceEntries) {
        if (sourceEnqueued >= CHAPTERS_PER_SOURCE) break;

        try {
          // Fetch chapter list from source
          const chapters: SourceChapter[] = await source.fetchChapterList(entry.seriesId);

          // Get already-downloaded chapter numbers
          const downloaded = await pb.collection("chapterDownloads").getFullList({
            filter: `mangaId = "${entry.id}"`,
            fields: "chapterNum",
          });
          const downloadedNums = new Set(downloaded.map((r) => r["chapterNum"] as number));

          // Find chapters not yet downloaded (oldest first, skip locked)
          const undownloaded = chapters.filter(
            (ch) => !ch.isLocked && !downloadedNums.has(ch.number),
          );

          if (undownloaded.length === 0) continue;

          // Take up to remaining budget for this source
          const remaining = CHAPTERS_PER_SOURCE - sourceEnqueued;
          const toDownload = undownloaded.slice(0, remaining);

          const items = toDownload.map((ch) => ({
            chapterNum: ch.number,
            chapterUrl: ch.url,
            episodeTitle: ch.title,
            sourceId,
          }));

          downloadManager.enqueue(entry.id, entry.title, items);
          sourceEnqueued += items.length;

          console.log(
            `[cron] Enqueued ${items.length} chapters for "${entry.title}" (${sourceId})`,
          );
        } catch (err) {
          const msg = `Failed to process "${entry.title}" (${sourceId}): ${err instanceof Error ? err.message : String(err)}`;
          console.error(`[cron] ${msg}`);
          result.errors.push(msg);
        }
      }

      result.sources[sourceId] = sourceEnqueued;
      result.enqueued += sourceEnqueued;
    }

    console.log(
      `[cron] Download job complete: ${result.enqueued} chapters enqueued across ${Object.keys(result.sources).length} sources`,
    );
  } catch (err) {
    const msg = `Cron job failed: ${err instanceof Error ? err.message : String(err)}`;
    console.error(`[cron] ${msg}`);
    result.errors.push(msg);
  } finally {
    isRunning = false;
  }

  return result;
}

/** Start the 12-hour cron timer. Safe to call multiple times. */
export function startCronScheduler(): void {
  if (cronTimer) return;

  // Ensure sources are registered
  getAllSources();

  console.log("[cron] Starting chapter download scheduler (every 12 hours)");
  cronTimer = setInterval(() => {
    console.log(`[cron] Triggering scheduled download at ${new Date().toISOString()}`);
    runCronDownload().catch((err) => {
      console.error("[cron] Unhandled error in scheduled download:", err);
    });
  }, CRON_INTERVAL_MS);

  // Don't block Node.js from exiting
  if (cronTimer.unref) {
    cronTimer.unref();
  }
}

/** Stop the cron timer. */
export function stopCronScheduler(): void {
  if (cronTimer) {
    clearInterval(cronTimer);
    cronTimer = null;
    console.log("[cron] Chapter download scheduler stopped");
  }
}

/** Check if the cron scheduler is active. */
export function isCronRunning(): boolean {
  return cronTimer !== null;
}
