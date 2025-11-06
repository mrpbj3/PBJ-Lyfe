// client/src/App.tsx

import { useEffect } from "react";
import { Switch, Route, Redirect, useLocation, Link } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// If you prefer your shared instance later, swap this for:
// import { queryClient } from "@/lib/queryClient";
const queryClient = new QueryClient();

// UI providers (ensure these paths/casing match your files under client/src/components/ui/)
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

// Auth/profile hooks (ensure these export { user, isLoading } and { data, isLoading })
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

// Pages (ensure filenames/case match exactly under client/src/pages/** and client/src/auth/**)
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Today from "@/pages/today";
import ProfileOnboarding from "@/pages/onboarding/ProfileOnboarding";
import AuthCallback from "@/auth/AuthCallback";
import NotFound from "@/pages/not-found";

function DecisionGate() {
  const { user, isLoading } = useAuth();
  const { data: profile, isLoading: pLoading } = useProfile();
  const [, navigate] = useLocation(); // <-- make sure this import exists above

  // Loading gate
  if (isLoading || pLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        Checking your profile…
      </div>
    );
  }

  // Public redirect is safe to render
  if (!user) return <Redirect to="/" />;

  // All imperative navigation in an effect (NOT during render)
  useEffect(() => {
    if (!profile || !profile.is_onboarding_complete) {
      navigate("/onboarding/profile", { replace: true });
    } else {
      navigate("/today", { replace: true });
    }
  }, [profile, navigate]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          {/* public */}
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/auth/callback" component={AuthCallback} />

          {/* decision route after any login */}
          <Route path="/app" component={DecisionGate} />

          {/* protected */}
          <Route path="/today" component={Today} />
          <Route path="/onboarding/profile" component={ProfileOnboarding} />

          {/* 404 */}
          <Route component={NotFound} />
        </Switch>

        {/* tiny debug nav; remove when done */}
        <div style={{ position: "fixed", bottom: 12, left: 12, fontSize: 12 }}>
          <Link href="/">Home</Link> · <Link href="/today">Today</Link> ·{" "}
          <Link href="/app">App</Link>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
