"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/" || pathname === "/login") return true;
  if (/^\/manhwa\/[^/]+$/.test(pathname)) return true;
  if (/^\/manhwa\/[^/]+\/read\/[^/]+$/.test(pathname)) return true;
  return false;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = isPublicRoute(pathname);

  return (
    <>
      <Navbar />
      {isPublic ? children : <AuthGuard>{children}</AuthGuard>}
    </>
  );
}
