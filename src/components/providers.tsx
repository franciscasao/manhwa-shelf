"use client";

import { TRPCReactProvider } from "@/trpc/client";
import { AuthContext, useAuthProvider } from "@/hooks/use-auth";

export function Providers({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();

  return (
    <AuthContext.Provider value={auth}>
      <TRPCReactProvider>{children}</TRPCReactProvider>
    </AuthContext.Provider>
  );
}
