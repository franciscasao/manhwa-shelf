"use client";

import { useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { mapAniListToManga } from "@/lib/anilist";
import { findWebtoonLink } from "@/lib/webtoon";
import { useShelf } from "@/hooks/use-shelf";
import { useMediaDetail } from "@/hooks/use-media-detail";
import { useWebtoonEpisodes } from "@/hooks/use-webtoon-episodes";
import { ArrowLeft } from "lucide-react";
import { ManhwaHeader } from "@/components/manhwa/manhwa-header";
import { ManhwaMetadata } from "@/components/manhwa/manhwa-metadata";
import { ManhwaSynopsis } from "@/components/manhwa/manhwa-synopsis";
import { ChapterDirectory } from "@/components/manhwa/chapter-directory";
import { ManhwaExternalLinks } from "@/components/manhwa/manhwa-external-links";
import { ManhwaRelations } from "@/components/manhwa/manhwa-relations";

export default function ManhwaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const { media, isLoading, error: fetchError } = useMediaDetail(id);
  const error = !id || isNaN(id) ? "Invalid media ID" : fetchError;
  const { shelf, addToShelf, removeFromShelf, isOnShelf } = useShelf();

  const webtoonParams = media ? findWebtoonLink(media.externalLinks) : null;
  const {
    episodes: webtoonEpisodes,
    isLoading: webtoonLoading,
    error: webtoonError,
    refetch: webtoonRefetch,
  } = useWebtoonEpisodes(webtoonParams);

  const bootLines = useRef([
    "> initializing file inspector...",
    "> connecting to anilist endpoint...",
    `> querying media id: ${id}`,
    "> resolving metadata...",
  ]);

  const shelfEntry = shelf.find((m) => m.id === String(id));

  const handleAdd = () => {
    if (!media) return;
    const manga = mapAniListToManga(media, media.countryOfOrigin === "JP" ? "JP" : "KR");
    addToShelf(manga);
  };

  const handleRemove = () => {
    removeFromShelf(String(id));
  };

  return (
    <div className="font-mono relative min-h-screen bg-terminal-bg text-terminal-green overflow-hidden">
      {/* CRT scanline overlay */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-50" style={{
        background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)"
      }} />

      <div className="relative z-10 mx-auto max-w-[900px] animate-[flicker_4s_infinite] px-3 py-6 md:px-8 md:py-10">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-terminal-dim hover:text-terminal-cyan transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          [ BACK ]
        </button>

        {/* Loading state — terminal boot sequence */}
        {isLoading && (
          <div className="text-xs font-mono space-y-1">
            {bootLines.current.map((line, i) => (
              <div
                key={i}
                className="text-terminal-dim detail-section"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                {line}
              </div>
            ))}
            <div
              className="text-terminal-orange detail-section"
              style={{ animationDelay: `${bootLines.current.length * 150}ms` }}
            >
              {">"} loading<span className="blink-cursor">_</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="border border-terminal-orange/40 bg-terminal-orange/[0.03] px-3 py-3 text-xs font-mono space-y-0.5">
            <div className="text-terminal-orange">{">"} INSPECTION ERROR</div>
            <div className="text-terminal-orange/70">{">"} ERR: {error}</div>
            <div className="text-terminal-muted">{">"} check media id and retry</div>
          </div>
        )}

        {/* Content */}
        {media && !isLoading && (
          <div className="space-y-5">
            {/* Header section */}
            <div className="detail-section" style={{ animationDelay: "0ms" }}>
              <ManhwaHeader
                media={media}
                shelfEntry={shelfEntry}
                onAdd={handleAdd}
                onRemove={handleRemove}
              />
            </div>

            {/* Metadata */}
            <div className="detail-section" style={{ animationDelay: "100ms" }}>
              <ManhwaMetadata media={media} />
            </div>

            {/* Synopsis */}
            <div className="detail-section" style={{ animationDelay: "200ms" }}>
              <ManhwaSynopsis description={media.description} />
            </div>

            {/* External Sources */}
            <div className="detail-section" style={{ animationDelay: "250ms" }}>
              <ManhwaExternalLinks externalLinks={media.externalLinks} />
            </div>

            {/* Chapter Directory */}
            <div className="detail-section" style={{ animationDelay: "300ms" }}>
              <ChapterDirectory
                totalChapters={media.chapters}
                downloaded={shelfEntry?.chapters.downloaded ?? 0}
                isOnShelf={isOnShelf(String(id))}
                webtoonEpisodes={webtoonEpisodes}
                webtoonLoading={webtoonLoading}
                webtoonError={webtoonError}
                webtoonUrl={webtoonParams?.url}
                onRefetch={webtoonRefetch}
              />
            </div>

            {/* Relations */}
            <div className="detail-section" style={{ animationDelay: "400ms" }}>
              <ManhwaRelations relations={media.relations} />
            </div>

            {/* Footer */}
            <div className="border-t border-terminal-border pt-3 text-[0.6rem] font-mono text-terminal-muted detail-section" style={{ animationDelay: "500ms" }}>
              <span className="text-terminal-dim">[</span>
              <span className="text-terminal-green">DB</span>
              <span className="text-terminal-dim">]</span>
              {" "}media #{media.id}
              <span className="mx-2">|</span>
              source: anilist
              <span className="mx-2">|</span>
              {isOnShelf(String(id))
                ? <span className="text-terminal-green">on shelf</span>
                : <span>not on shelf</span>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
