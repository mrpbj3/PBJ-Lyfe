// client/src/App.tsx

import { useEffect } from "react";
import { Switch, Route, Redirect, useLocation, Link } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Use a local QueryClient first; we can swap to "@/lib/queryClient" later if you prefer.
const queryClient = new QueryClient();

// These UI components must exist at client/src/components/ui/{tooltip,toaster}.tsx
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

// Hooks (ensure they export { user, isLoading } and { data, isLoading })
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

// Pages (CAUTION: match exact casing & paths)
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Today from "@/pages/today";
// ⬇⬇⬇ FIXED: match your file name exactly (ProfileOnboarding.tsx)
import ProfileOnboarding from "@/pages/onboarding/ProfileOnboarding";
import AuthCallback from "@/auth/AuthCallback";
import NotFound from "@/pages/not-found";

function DecisionGate() {
  const { user, isLoading } = useAuth();
  const { data: profile, isLoading: pLoading } = useProfile();
  const [, navigate] = useLocation();

  if (isLoading || pLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        Checking your profile…
      </div>
    );
  }

  if (!user) return <Redirect to="/" />;

  // Do not navigate during render; use an effect
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
