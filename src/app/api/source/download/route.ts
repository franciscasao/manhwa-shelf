import { NextRequest } from "next/server";
import { getSource } from "@/extensions";
import { getServerPB } from "@/lib/db-server";
import type { DownloadStreamEvent } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sourceId, mangaId, chapterNum, chapterUrl, episodeTitle } = body as {
    sourceId: string;
    mangaId: string;
    mangaTitle: string;
    chapterNum: number;
    chapterUrl: string;
    episodeTitle?: string;
  };

  if (!sourceId || !mangaId || !chapterNum || !chapterUrl) {
    return new Response(
      JSON.stringify({ type: "error", message: "Missing required fields" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const source = getSource(sourceId);
  if (!source) {
    return new Response(
      JSON.stringify({ type: "error", message: `Unknown source: ${sourceId}` }),
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
        // 1. Fetch page images from the source extension
        const pages = await source.fetchChapterPages(chapterUrl);

        if (pages.length === 0) {
          send({ type: "error", message: "No images found in chapter" });
          controller.close();
          return;
        }

        const total = pages.length;
        send({ type: "pages", total });

        // 2. Download images in batches of 3
        const imageData: { buffer: Uint8Array; contentType: string }[] = [];
        const batchSize = 3;
        let downloaded = 0;

        for (let i = 0; i < pages.length; i += batchSize) {
          if (cancelled) {
            send({ type: "error", message: "Download cancelled" });
            controller.close();
            return;
          }

          const batch = pages.slice(i, i + batchSize);
          const results = await Promise.all(
            batch.map(async (page) => {
              const headers = { ...source.imageHeaders, ...page.headers };
              const res = await fetch(page.url, { headers });

              if (!res.ok) {
                throw new Error(`Image fetch failed: ${res.status} for ${page.url}`);
              }

              const buffer = await res.arrayBuffer();
              const contentType = res.headers.get("content-type") ?? "image/jpeg";
              return { buffer, contentType };
            }),
          );

          for (const { buffer, contentType } of results) {
            imageData.push({ buffer: new Uint8Array(buffer), contentType });
            downloaded++;
            send({ type: "progress", downloaded, total });
          }
        }

        // 3. Upload individual images to PocketBase
        const sizeBytes = imageData.reduce((sum, img) => sum + img.buffer.byteLength, 0);

        send({ type: "uploading" });

        const pb = getServerPB();

        // Dedup: check if this chapter already exists
        const existing = await pb
          .collection("chapterDownloads")
          .getList(1, 1, {
            filter: `mangaId = "${mangaId}" && chapterNum = ${chapterNum}`,
          });

        let recordId: string;

        const formData = new FormData();
        formData.append("mangaId", mangaId);
        formData.append("chapterNum", String(chapterNum));
        formData.append("episodeTitle", episodeTitle ?? "");
        formData.append("sizeBytes", String(sizeBytes));
        formData.append("downloadedAt", String(Date.now()));

        for (let i = 0; i < imageData.length; i++) {
          const { buffer, contentType } = imageData[i];
          const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
          const fileName = `${String(i + 1).padStart(3, "0")}.${ext}`;
          formData.append("images", new Blob([buffer.buffer as ArrayBuffer], { type: contentType }), fileName);
        }

        if (existing.totalItems > 0) {
          const record = await pb
            .collection("chapterDownloads")
            .update(existing.items[0].id, formData);
          recordId = record.id;
        } else {
          const record = await pb
            .collection("chapterDownloads")
            .create(formData);
          recordId = record.id;
        }

        // 4. Update shelf downloaded count and size
        try {
          const allChapters = await pb
            .collection("chapterDownloads")
            .getFullList({
              filter: `mangaId = "${mangaId}"`,
              fields: "sizeBytes",
            });

          const totalChapters = allChapters.length;
          const totalBytes = allChapters.reduce(
            (sum, ch) => sum + (ch.sizeBytes || 0),
            0,
          );
          const formattedSize =
            totalBytes >= 1024 * 1024 * 1024
              ? `${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
              : `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;

          const shelfRecord = await pb.collection("shelf").getOne(mangaId);
          const existingChapters = shelfRecord.chapters as {
            downloaded: number;
            total: number | null;
          };

          await pb.collection("shelf").update(mangaId, {
            chapters: {
              downloaded: totalChapters,
              total: existingChapters?.total ?? null,
            },
            sizeOnDisk: formattedSize,
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
