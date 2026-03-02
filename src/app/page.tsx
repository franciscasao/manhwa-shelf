"use client";

import { HeroSection } from "@/components/homepage/hero-section";
import { CatalogGrid } from "@/components/homepage/catalog-grid";

export default function HomePage() {
  return (
    <div className="font-mono relative min-h-screen overflow-hidden bg-terminal-bg text-terminal-green">
      {/* CRT scanline overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px] animate-[flicker_4s_infinite] px-3 py-6 md:px-8 md:py-10">
        <HeroSection />
        <CatalogGrid />
      </div>
    </div>
  );
}
