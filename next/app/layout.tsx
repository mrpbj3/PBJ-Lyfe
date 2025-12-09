"use client";

import "./globals.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/auth/AuthProvider";
import { ProfileProvider } from "@/hooks/useProfile";
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProfileProvider>
              {children}
              <Toaster />
            </ProfileProvider>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
