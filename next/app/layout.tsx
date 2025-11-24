// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/auth/AuthProvider";
import { GlobalAuthGuard } from "./GlobalAuthGuard";

export const metadata: Metadata = {
  title: "PBJ Lyfe",
  description: "Lifestyle tracking app",
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
          <GlobalAuthGuard>{children}</GlobalAuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
