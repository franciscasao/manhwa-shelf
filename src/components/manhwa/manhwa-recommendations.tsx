import Link from "next/link";
import Image from "next/image";
import { AniListMediaDetail } from "@/lib/anilist";
import { toPocketBaseId } from "@/lib/manga-utils";

interface ManhwaRecommendationsProps {
  recommendations: AniListMediaDetail["recommendations"];
  isOnShelf?: (id: string) => boolean;
}

export function ManhwaRecommendations({ recommendations, isOnShelf = () => false }: ManhwaRecommendationsProps) {
  if (!recommendations?.nodes?.length) return null;

  const mangaRecs = recommendations.nodes.filter(
    (n) => n.mediaRecommendation !== null && n.mediaRecommendation.type === "MANGA"
  );

  if (mangaRecs.length === 0) return null;

  return (
    <div className="border border-terminal-border/40 px-4 py-3">
      <div className="text-[0.6rem] text-terminal-muted tracking-widest mb-3">
        --- RECOMMENDATIONS ---
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {mangaRecs.map((node) => {
          const rec = node.mediaRecommendation!;
          const title = rec.title.english ?? rec.title.romaji;
          const onShelf = isOnShelf(toPocketBaseId(rec.id));

          return (
            <Link
              key={rec.id}
              href={`/manhwa/${rec.id}`}
              className="group flex-shrink-0 w-[90px] flex flex-col gap-1"
            >
              <div className={`relative w-[90px] h-[130px] overflow-hidden border ${onShelf ? "border-terminal-green/60" : "border-terminal-border/40"} group-hover:border-terminal-green/60 transition-colors`}>
                <Image
                  src={rec.coverImage.large}
                  alt={title ?? ""}
                  fill
                  className="object-cover"
                  sizes="90px"
                />
                {node.rating > 0 && (
                  <div className="absolute top-0 right-0 bg-black/70 px-1 py-0.5">
                    <span className="text-[0.5rem] text-terminal-orange tracking-wider">
                      +{node.rating}
                    </span>
                  </div>
                )}
                {onShelf && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
                    <span className="text-[0.5rem] text-terminal-green tracking-wider">ON SHELF</span>
                  </div>
                )}
              </div>
              <p className={`text-[0.6rem] ${onShelf ? "text-terminal-green" : "text-terminal-dim"} group-hover:text-terminal-green transition-colors leading-tight line-clamp-2`}>
                {title}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
