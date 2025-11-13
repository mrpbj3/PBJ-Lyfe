// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

import { AuthProvider } from "@/auth/AuthProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export const metadata: Metadata = {
  title: "PBJ Lyfe",
  description: "One simple daily flow to track your Lyfe",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
