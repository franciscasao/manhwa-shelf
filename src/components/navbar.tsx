"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";

const publicLinks = [{ href: "/", label: "HOME" }];

const authLinks = [
  { href: "/library", label: "LIBRARY" },
  { href: "/search", label: "SEARCH" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Don't show nav on login page
  if (pathname === "/login") return null;

  const links = user ? [...publicLinks, ...authLinks] : publicLinks;

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

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="text-xs text-terminal-dim hidden sm:inline">
                <span className="text-terminal-muted">user:</span>{" "}
                <span className="text-terminal-cyan">{user.email}</span>
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 border border-terminal-border px-2.5 py-1 text-xs text-terminal-dim hover:text-terminal-orange hover:border-terminal-orange/50 transition-colors"
                title="Logout"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden sm:inline">LOGOUT</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="border border-terminal-cyan/40 px-3 py-1 text-xs text-terminal-cyan hover:bg-terminal-cyan/10 transition-colors"
            >
              [ LOGIN ]
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
