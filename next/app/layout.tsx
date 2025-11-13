import "./globals.css";
import { AuthProvider, useAuth } from "@/auth/AuthProvider";

// --- Protect all pages globally ---
function GlobalAuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  // Allow login and callback pages to render without redirect
  if (typeof window !== "undefined") {
    const path = window.location.pathname;

    if (path.startsWith("/login") || path.startsWith("/auth/callback")) {
      return children;
    }
  }

  // Not authenticated → redirect to login
  if (!isAuthenticated) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  return children;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <GlobalAuthGuard>
            {children}
          </GlobalAuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
