import { NextRequest } from "next/server";
import { zipSync } from "fflate";
import {
  fetchWebtoonPage,
  parseImageUrlsFromHtml,
  fetchWebtoonImage,
} from "@/lib/webtoon-scraper";
import { getServerPB } from "@/lib/db-server";
import type { DownloadStreamEvent } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { mangaId, chapterNum, viewerUrl, episodeTitle } = body as {
    mangaId: string;
    mangaTitle: string;
    chapterNum: number;
    viewerUrl: string;
    episodeTitle?: string;
  };

  if (!mangaId || !chapterNum || !viewerUrl) {
    return new Response(
      JSON.stringify({ type: "error", message: "Missing required fields" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  let cancelled = false;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: DownloadStreamEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      try {
        // 1. Fetch page HTML and extract image URLs
        const html = await fetchWebtoonPage(viewerUrl);
        const imageUrls = parseImageUrlsFromHtml(html);

        if (imageUrls.length === 0) {
          send({ type: "error", message: "No images found in chapter" });
          controller.close();
          return;
        }

        const total = imageUrls.length;
        send({ type: "pages", total });

        // 2. Download images in batches of 3
        const imageBuffers: Uint8Array[] = [];
        const batchSize = 3;
        let downloaded = 0;

        for (let i = 0; i < imageUrls.length; i += batchSize) {
          if (cancelled) {
            send({ type: "error", message: "Download cancelled" });
            controller.close();
            return;
          }

          const batch = imageUrls.slice(i, i + batchSize);
          const results = await Promise.all(
            batch.map((url) => fetchWebtoonImage(url)),
          );

          for (const { buffer } of results) {
            imageBuffers.push(new Uint8Array(buffer));
            downloaded++;
            send({ type: "progress", downloaded, total });
          }
        }

        // 3. Create ZIP
        const files: Record<string, Uint8Array> = {};
        for (let i = 0; i < imageBuffers.length; i++) {
          const name = `${String(i + 1).padStart(3, "0")}.jpg`;
          files[name] = imageBuffers[i];
        }

        const zipData = zipSync(files);
        const sizeBytes = zipData.byteLength;

        // 4. Upload to PocketBase
        send({ type: "uploading" });

        const pb = getServerPB();

        // Dedup: check if this chapter already exists
        const existing = await pb
          .collection("chapterDownloads")
          .getList(1, 1, {
            filter: `mangaId = "${mangaId}" && chapterNum = ${chapterNum}`,
          });

        let recordId: string;

        const fileName = `${mangaId}_ch${String(chapterNum).padStart(3, "0")}.cbz`;
        const cbzBuffer = new ArrayBuffer(zipData.byteLength);
        new Uint8Array(cbzBuffer).set(zipData);
        const cbzBlob = new Blob([cbzBuffer], {
          type: "application/octet-stream",
        });

        const formData = new FormData();
        formData.append("mangaId", mangaId);
        formData.append("chapterNum", String(chapterNum));
        formData.append("episodeTitle", episodeTitle ?? "");
        formData.append("sizeBytes", String(sizeBytes));
        formData.append("downloadedAt", String(Date.now()));
        formData.append("cbzFile", cbzBlob, fileName);

        if (existing.totalItems > 0) {
          // Update existing record
          const record = await pb
            .collection("chapterDownloads")
            .update(existing.items[0].id, formData);
          recordId = record.id;
        } else {
          // Create new record
          const record = await pb
            .collection("chapterDownloads")
            .create(formData);
          recordId = record.id;
        }

        // 5. Update shelf downloaded count
        const countResult = await pb
          .collection("chapterDownloads")
          .getList(1, 1, {
            filter: `mangaId = "${mangaId}"`,
            skipTotal: false,
          });

        try {
          await pb.collection("shelf").update(mangaId, {
            "chapters.downloaded": countResult.totalItems,
          });
        } catch {
          // Shelf entry may not exist
        }

        send({ type: "complete", recordId, sizeBytes });
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Download failed",
        });
      } finally {
        controller.close();
      }
    },
    cancel() {
      cancelled = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
