import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Manga } from "@/lib/types";
import { getDownloadStatus } from "@/lib/manga-utils";

export function MangaCard({ manga }: { manga: Manga }) {
  const progress = manga.chapters.total
    ? Math.round((manga.chapters.downloaded / manga.chapters.total) * 100)
    : null;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <div className="aspect-[3/4] w-full overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={manga.coverImage}
          alt={manga.title}
          className="h-full w-full object-cover"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold leading-tight line-clamp-1">
          {manga.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{manga.author}</p>
        <div className="flex items-center gap-2 mt-2">
          <StatusBadge status={getDownloadStatus(manga)} />
          <span className="text-xs text-muted-foreground ml-auto">
            ★ {manga.rating}
          </span>
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-0">
        <div className="w-full">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>
              Ch. {manga.chapters.downloaded}
              {manga.chapters.total ? ` / ${manga.chapters.total}` : ""}
            </span>
            {progress !== null && <span>{progress}%</span>}
          </div>
          {manga.chapters.total && (
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
