interface ManhwaSynopsisProps {
  description: string | null;
}

export function ManhwaSynopsis({ description }: ManhwaSynopsisProps) {
  if (!description) return null;

  // AniList descriptions may contain <br> and basic HTML tags even with asHtml: false
  const cleaned = description
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .trim();

  if (!cleaned) return null;

  return (
    <div className="border border-terminal-border/40 px-4 py-3">
      <div className="text-[0.6rem] text-terminal-muted tracking-widest mb-2">
        --- SYNOPSIS ---
      </div>
      <p className="text-xs text-terminal-green/80 leading-relaxed whitespace-pre-line">
        {cleaned}
      </p>
    </div>
  );
}
