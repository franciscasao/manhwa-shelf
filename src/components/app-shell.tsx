"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";

const PUBLIC_ROUTES = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  return (
    <>
      <Navbar />
      {isPublic ? children : <AuthGuard>{children}</AuthGuard>}
    </>
  );
}
