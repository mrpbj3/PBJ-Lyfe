// app/GlobalAuthGuard.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/auth/AuthProvider";

const PUBLIC_PATHS = ["/login", "/auth/callback"];

export function GlobalAuthGuard({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p));

  // Redirect unauthenticated users away from protected pages
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublic) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, isPublic, router]);

  // While auth state is loading on protected routes, show spinner
  if (isLoading && !isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  // After we decide to redirect, render nothing to avoid a flash
  if (!isAuthenticated && !isPublic) {
    return null;
  }

  // Public routes or authenticated users see the app normally
  return <>{children}</>;
}
