import type { DownloadStreamEvent } from "@/lib/types";

export interface DownloadResult {
  recordId: string;
  sizeBytes: number;
}

export async function downloadChapterToServer(
  mangaId: string,
  mangaTitle: string,
  chapterNum: number,
  viewerUrl: string,
  episodeTitle: string,
  onProgress?: (downloaded: number, total: number) => void,
  onUploading?: () => void,
  signal?: AbortSignal,
): Promise<DownloadResult> {
  const res = await fetch("/api/webtoon/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mangaId, mangaTitle, chapterNum, viewerUrl, episodeTitle }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`Download request failed: ${res.status}`);
  }

  if (!res.body) {
    throw new Error("No response body");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: DownloadResult | null = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    // Keep the last incomplete line in the buffer
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const event: DownloadStreamEvent = JSON.parse(line);

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
          result = { recordId: event.recordId, sizeBytes: event.sizeBytes };
          break;
        case "error":
          throw new Error(event.message);
      }
    }
  }

  if (!result) {
    throw new Error("Stream ended without completion event");
  }

  return result;
}
