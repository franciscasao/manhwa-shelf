"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && !user.verified) {
      logout();
      router.replace("/login");
    }
  }, [user, logout, router]);

  if (isLoading) {
    return (
      <div className="font-mono min-h-screen bg-terminal-bg text-terminal-green flex items-center justify-center">
        <div className="text-xs">
          {">"} loading session
          <span className="blink-cursor">_</span>
        </div>
      </div>
    );
  }

  if (!user || !user.verified) {
    return null;
  }

  return <>{children}</>;
}
