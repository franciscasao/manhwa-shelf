import PocketBase from "pocketbase";

/**
 * Migration: Compute avgChapterSize for all existing shelf records.
 *
 * For each shelf entry that has downloaded chapters, queries the
 * chapterDownloads collection to compute totalBytes / totalChapters
 * and writes the formatted average back to shelf.avgChapterSize.
 *
 * Usage: pnpm db:migrate:avg-chapter-size
 */

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_POCKETBASE_URL ?? "http://127.0.0.1:8090";
  const email = process.env.PB_ADMIN_EMAIL;
  const password = process.env.PB_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("Missing PB_ADMIN_EMAIL or PB_ADMIN_PASSWORD environment variables.");
    process.exit(1);
  }

  const pb = new PocketBase(url);

  console.log(`Connecting to PocketBase at ${url}...`);
  try {
    await pb.collection("_superusers").authWithPassword(email, password);
  } catch (err) {
    const e = err as Error;
    console.error("Failed to authenticate:", e.message ?? err);
    process.exit(1);
  }
  console.log("Authenticated as superuser.\n");

  // Ensure the avgChapterSize field exists on the shelf collection
  try {
    const shelfCollection = await pb.collections.getOne("shelf");
    const fields = shelfCollection.fields as Array<{ name: string; type: string }>;
    const hasField = fields.some((f) => f.name === "avgChapterSize");
    if (!hasField) {
      console.log("Adding avgChapterSize field to shelf collection...");
      const updatedFields = [...fields, { name: "avgChapterSize", type: "text" }];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PocketBase SDK types don't expose collection update fields
      await pb.collections.update(shelfCollection.id, { fields: updatedFields } as any);
      console.log("Field added.\n");
    }
  } catch (err) {
    const e = err as Error;
    console.error("Failed to check/add avgChapterSize field:", e.message ?? err);
    process.exit(1);
  }

  // Fetch all shelf records
  const shelfRecords = await pb.collection("shelf").getFullList();
  console.log(`Found ${shelfRecords.length} shelf records.`);

  let updated = 0;
  let skipped = 0;

  for (const record of shelfRecords) {
    const mangaId = record.id;
    const chapters = record.chapters as { downloaded: number; total: number | null } | undefined;

    if (!chapters || chapters.downloaded === 0) {
      skipped++;
      continue;
    }

    // Query all chapter downloads for this manga
    const downloads = await pb.collection("chapterDownloads").getFullList({
      filter: `mangaId = "${mangaId}"`,
      fields: "sizeBytes",
    });

    if (downloads.length === 0) {
      skipped++;
      continue;
    }

    const totalBytes = downloads.reduce((sum, ch) => sum + ((ch.sizeBytes as number) || 0), 0);
    const avgBytes = totalBytes / downloads.length;
    const avgChapterSize = formatBytes(avgBytes);

    await pb.collection("shelf").update(mangaId, { avgChapterSize });
    console.log(`  [${mangaId}] ${record.title}: ${avgChapterSize}/ch (${downloads.length} chapters, ${formatBytes(totalBytes)} total)`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
}

main();
