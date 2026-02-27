import type { TRPCClient } from "@trpc/client";
import type { AppRouter } from "@/trpc/routers/_app";
import type { DownloadStreamEvent } from "@/lib/types";

export interface DownloadResult {
  recordId: string;
  sizeBytes: number;
}

export async function downloadChapterToServer(
  trpcClient: TRPCClient<AppRouter>,
  mangaId: string,
  mangaTitle: string,
  chapterNum: number,
  chapterUrl: string,
  episodeTitle: string,
  sourceId: string,
  onProgress?: (downloaded: number, total: number) => void,
  onUploading?: () => void,
  signal?: AbortSignal,
): Promise<DownloadResult> {
  return new Promise<DownloadResult>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Download cancelled"));
      return;
    }

    const subscription = trpcClient.download.downloadChapter.subscribe(
      {
        sourceId,
        mangaId,
        mangaTitle,
        chapterNum,
        chapterUrl,
        episodeTitle,
      },
      {
        onData(event: DownloadStreamEvent) {
          switch (event.type) {
            case "pages":
              onProgress?.(0, event.total);
              break;
            case "progress":
              onProgress?.(event.downloaded, event.total);
              break;
            case "uploading":
              onUploading?.();
              break;
            case "complete":
              subscription.unsubscribe();
              resolve({ recordId: event.recordId, sizeBytes: event.sizeBytes });
              break;
            case "error":
              subscription.unsubscribe();
              reject(new Error(event.message));
              break;
          }
        },
        onError(err) {
          reject(err instanceof Error ? err : new Error("Subscription failed"));
        },
        onComplete() {
          // If we reach here without a complete event, it's unexpected
        },
      },
    );

    // Handle abort signal
    signal?.addEventListener("abort", () => {
      subscription.unsubscribe();
      reject(new Error("Download cancelled"));
    }, { once: true });
  });
}
