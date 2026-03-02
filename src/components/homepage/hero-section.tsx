"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useAuth } from "@/hooks/use-auth";

export function HeroSection() {
  const trpc = useTRPC();
  const { user } = useAuth();
  const { data: stats } = useQuery(trpc.catalog.getStats.queryOptions());

  return (
    <section className="relative border border-terminal-border/40 px-6 py-10 md:px-10 md:py-14 mb-8 overflow-hidden">
      {/* CRT scanline overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)",
        }}
      />

      <div className="relative z-10">
        {/* Boot sequence */}
        <div className="text-[0.6rem] text-terminal-muted mb-4 space-y-0.5">
          <div>{">"} boot sequence initiated...</div>
          <div>{">"} loading shelf archive...</div>
          <div className="text-terminal-green">{">"} system ready.</div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-bold text-terminal-green mb-3 tracking-tight">
          &gt; manhwa-shelf
        </h1>

        {/* Tagline */}
        <p className="text-sm md:text-base text-terminal-dim mb-6 max-w-lg">
          A local manga &amp; manhwa archive with a retro-terminal interface.
          Browse the catalog and read downloaded chapters
          <span className="blink-cursor">_</span>
        </p>

        {/* Stats line */}
        {stats && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs mb-8">
            <span>
              <span className="text-terminal-muted">titles:</span>{" "}
              <span className="text-terminal-cyan">{stats.totalTitles}</span>
            </span>
            <span>
              <span className="text-terminal-muted">chapters:</span>{" "}
              <span className="text-terminal-cyan">{stats.totalChapters}</span>
            </span>
            <span>
              <span className="text-terminal-muted">disk:</span>{" "}
              <span className="text-terminal-cyan">{stats.totalSizeGB.toFixed(1)} GB</span>
            </span>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-wrap gap-3">
          <a
            href="#catalog"
            className="border border-terminal-cyan/50 px-4 py-2 text-xs text-terminal-cyan hover:bg-terminal-cyan/10 transition-colors"
          >
            [ BROWSE CATALOG ]
          </a>
          {!user && (
            <Link
              href="/login"
              className="border border-terminal-border px-4 py-2 text-xs text-terminal-dim hover:text-terminal-green hover:border-terminal-green/40 transition-colors"
            >
              [ LOGIN ]
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
