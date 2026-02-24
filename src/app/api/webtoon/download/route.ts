import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { zipSync } from "fflate";
import {
  fetchWebtoonPage,
  parseImageUrlsFromHtml,
  fetchWebtoonImage,
} from "@/lib/webtoon-scraper";
import type { DownloadStreamEvent } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { mangaId, chapterNum, viewerUrl } = body as {
    mangaId: string;
    mangaTitle: string;
    chapterNum: number;
    viewerUrl: string;
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

        // 4. Write to disk
        const dir = join(process.cwd(), "downloads", mangaId);
        await mkdir(dir, { recursive: true });
        const filePath = join(dir, `${String(chapterNum).padStart(3, "0")}.cbz`);
        await writeFile(filePath, zipData);

        send({
          type: "complete",
          path: filePath,
          sizeBytes: zipData.byteLength,
        });
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
