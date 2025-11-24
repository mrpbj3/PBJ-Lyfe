"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/auth/AuthProvider";
import { ProfileProvider } from "@/hooks/useProfile";
import { GlobalAuthGuard } from "./GlobalAuthGuard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProfileProvider>
          <GlobalAuthGuard>{children}</GlobalAuthGuard>
        </ProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
