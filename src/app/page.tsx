import { MangaCard } from "@/components/manga-card";
import { Separator } from "@/components/ui/separator";
import { sampleManga } from "@/data/sample";

export default function Home() {
  const downloaded = sampleManga.filter((m) => m.chapters.downloaded > 0);
  const recentlyUpdated = [...sampleManga]
    .filter((m) => m.lastUpdated)
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
    .slice(0, 4);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-2xl font-bold tracking-tight">Downloaded</h2>
        <p className="text-muted-foreground mt-1">Titles with downloaded chapters</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
          {downloaded.map((manga) => (
            <MangaCard key={manga.id} manga={manga} />
          ))}
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-2xl font-bold tracking-tight">Recently Updated</h2>
        <p className="text-muted-foreground mt-1">Your latest activity</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
          {recentlyUpdated.map((manga) => (
            <MangaCard key={manga.id} manga={manga} />
          ))}
        </div>
      </section>
    </div>
  );
}
