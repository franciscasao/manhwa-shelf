import { AniListMediaDetail } from "@/lib/anilist";

interface ManhwaMetadataProps {
  media: AniListMediaDetail;
}

function formatDate(d: { year: number | null; month: number | null; day: number | null } | null): string {
  if (!d || !d.year) return "—";
  const parts = [String(d.year)];
  if (d.month) parts.push(String(d.month).padStart(2, "0"));
  if (d.day) parts.push(String(d.day).padStart(2, "0"));
  return parts.join("-");
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  const dots = ".".repeat(Math.max(2, 20 - label.length));
  return (
    <div className="flex items-baseline gap-0 text-xs font-mono">
      <span className="text-terminal-muted shrink-0">{label}</span>
      <span className="text-terminal-border shrink-0 mx-0.5">{dots}</span>
      <span className="text-terminal-green truncate">{value}</span>
    </div>
  );
}

export function ManhwaMetadata({ media }: ManhwaMetadataProps) {
  const storyEdge = media.staff.edges.find(
    (e) => e.role === "Story" || e.role === "Story & Art",
  );
  const artEdge = media.staff.edges.find(
    (e) => e.role === "Art" || e.role === "Story & Art",
  );
  const author = storyEdge?.node.name.full ?? media.staff.nodes[0]?.name.full ?? "Unknown";
  const artist = artEdge?.node.name.full;

  const rows: { label: string; value: string }[] = [
    { label: "AUTHOR", value: author },
  ];

  if (artist && artist !== author) {
    rows.push({ label: "ARTIST", value: artist });
  }

  if (media.source) {
    rows.push({ label: "SOURCE", value: media.source.replace(/_/g, " ") });
  }

  rows.push({ label: "START", value: formatDate(media.startDate) });

  if (media.endDate?.year) {
    rows.push({ label: "END", value: formatDate(media.endDate) });
  }

  if (media.volumes != null) {
    rows.push({ label: "VOLUMES", value: String(media.volumes) });
  }

  if (media.chapters != null) {
    rows.push({ label: "CHAPTERS", value: String(media.chapters) });
  }

  if (media.popularity != null) {
    rows.push({ label: "POPULARITY", value: media.popularity.toLocaleString() });
  }

  if (media.favourites != null) {
    rows.push({ label: "FAVOURITES", value: media.favourites.toLocaleString() });
  }

  return (
    <div className="border border-terminal-border/40 px-4 py-3">
      <div className="text-[0.6rem] text-terminal-muted tracking-widest mb-2">
        --- METADATA ---
      </div>
      <div className="space-y-1">
        {rows.map((r) => (
          <MetadataRow key={r.label} label={r.label} value={r.value} />
        ))}
      </div>
    </div>
  );
}
