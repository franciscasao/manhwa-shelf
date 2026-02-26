import { ExternalLink } from "lucide-react";
import { AniListExternalLink, getEnglishLinks } from "@/lib/anilist";

interface ManhwaExternalLinksProps {
  externalLinks: AniListExternalLink[] | null;
  activeSourceUrl?: string;
}

export function ManhwaExternalLinks({ externalLinks, activeSourceUrl }: ManhwaExternalLinksProps) {
  const englishLinks = getEnglishLinks(externalLinks);

  if (englishLinks.length === 0) return null;

  return (
    <div className="border border-terminal-border/40 px-4 py-3">
      <div className="text-[0.6rem] text-terminal-muted tracking-widest mb-2">--- EXTERNAL SOURCES ---</div>
      <div className="space-y-1">
        {englishLinks.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs group"
          >
            <span className="text-terminal-dim shrink-0">{">"}</span>
            {link.icon && <img src={link.icon} alt="" width={14} height={14} className="shrink-0" />}
            <span className="text-terminal-cyan group-hover:text-terminal-green transition-colors truncate">
              {link.site}
            </span>
            {activeSourceUrl && link.url === activeSourceUrl && (
              <span className="text-terminal-green text-[0.6rem] shrink-0">[CHAPTERS]</span>
            )}
            <ExternalLink className="h-3 w-3 text-terminal-dim opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}
