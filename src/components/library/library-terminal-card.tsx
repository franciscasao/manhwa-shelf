import { Trash2 } from "lucide-react";
import { Manga } from "@/lib/types";
import { MangaTerminalCard } from "@/components/manga-terminal-card";

interface LibraryTerminalCardProps {
  manga: Manga;
  index: number;
  onRemove: (id: string) => void;
}

export function LibraryTerminalCard({ manga, index, onRemove }: LibraryTerminalCardProps) {
  return (
    <MangaTerminalCard
      manga={manga}
      index={index}
      action={
        <button
          onClick={() => onRemove(manga.id)}
          className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 border-t border-terminal-border/40 bg-terminal-bg/95 py-1.5 text-xs font-mono text-terminal-orange opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
        >
          <Trash2 className="h-3 w-3" />
          [ REMOVE ]
        </button>
      }
    />
  );
}
