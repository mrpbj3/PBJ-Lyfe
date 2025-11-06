import { useEffect } from "react";
import { Switch, Route, Redirect, useLocation, Link } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// If you prefer your shared instance later, swap this for:
// import { queryClient } from "@/lib/queryClient";
const queryClient = new QueryClient();

// UI providers (ensure paths exist: client/src/components/ui/{toaster,tooltip}.tsx)
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

// Auth/profile hooks (ensure these files exist and export the shown API)
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

// Pages (ensure filenames/case match exactly under client/src/pages/**)
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Today from "@/pages/today";
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

  // Imperative navigation must be done in an effect (not during render)
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

        {/* quick nav while debugging */}
        <div style={{ position: "fixed", bottom: 12, left: 12, fontSize: 12 }}>
          <Link href="/">Home</Link> · <Link href="/today">Today</Link> ·{" "}
          <Link href="/app">App</Link>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
