"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "LIBRARY" },
  { href: "/search", label: "SEARCH" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-terminal-border bg-terminal-bg font-mono">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/" className="mr-8 text-terminal-green font-bold text-lg">
          &gt; manhwa-shelf
        </Link>
        <nav className="flex gap-6 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium whitespace-nowrap transition-colors hover:text-terminal-green",
                pathname === link.href
                  ? "text-terminal-cyan"
                  : "text-terminal-dim"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
