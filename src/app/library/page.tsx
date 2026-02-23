"use client";

import { useState } from "react";
import { MangaCard } from "@/components/manga-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sampleManga } from "@/data/sample";
import { DownloadStatus, Manga } from "@/lib/types";

function getDownloadStatus(manga: Manga): DownloadStatus {
  if (manga.chapters.downloaded === 0) return "not-downloaded";
  if (manga.chapters.total && manga.chapters.downloaded >= manga.chapters.total) return "complete";
  return "partial";
}

const tabs: { value: "all" | DownloadStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "complete", label: "Complete" },
  { value: "partial", label: "Partial" },
  { value: "not-downloaded", label: "Not Downloaded" },
];

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState("all");

  const filtered =
    activeTab === "all"
      ? sampleManga
      : sampleManga.filter((m) => getDownloadStatus(m) === activeTab);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Library</h1>
      <p className="text-muted-foreground mt-1">Your complete collection</p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                No titles in this category yet.
              </p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
