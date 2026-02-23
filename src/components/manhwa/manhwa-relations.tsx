import Link from "next/link";
import { AniListMediaDetail } from "@/lib/anilist";

interface ManhwaRelationsProps {
  relations: AniListMediaDetail["relations"];
}

export function ManhwaRelations({ relations }: ManhwaRelationsProps) {
  if (!relations?.edges?.length) return null;

  // Only show manga-type relations
  const mangaRelations = relations.edges.filter(
    (e) => e.node.type === "MANGA"
  );

  if (mangaRelations.length === 0) return null;

  return (
    <div className="border border-terminal-border/40 px-4 py-3">
      <div className="text-[0.6rem] text-terminal-muted tracking-widest mb-2">
        --- RELATIONS ---
      </div>
      <div className="space-y-1">
        {mangaRelations.map((edge) => {
          const title = edge.node.title.english ?? edge.node.title.romaji;
          const relType = edge.relationType.replace(/_/g, " ");

          return (
            <Link
              key={edge.node.id}
              href={`/manhwa/${edge.node.id}`}
              className="flex items-center gap-2 text-xs group"
            >
              <span className="text-terminal-dim shrink-0">{">"}</span>
              <span className="text-terminal-muted shrink-0 w-[90px] text-[0.6rem]">
                [{relType}]
              </span>
              <span className="text-terminal-cyan group-hover:text-terminal-green transition-colors truncate">
                {title}
              </span>
              {edge.node.format && (
                <span className="text-terminal-dim text-[0.6rem] shrink-0">
                  ({edge.node.format})
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
