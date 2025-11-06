import { useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile"; // added below
import { AuthProviders } from "@/auth/AuthProviders";
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

  // Show a loading state while auth/profile are resolving
  if (isLoading || pLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        Checking your profile…
      </div>
    );
  }

  // Public redirect is safe to render
  if (!user) return <Redirect to="/" />;

  // All imperative navigation happens in an effect (not during render)
  useEffect(() => {
    if (!profile || !profile.is_onboarding_complete) {
      navigate("/onboarding/profile", { replace: true });
    } else {
      navigate("/today", { replace: true });
    }
  }, [profile, navigate]);

  // Nothing to render; we immediately route in the effect
  return null;
}

import { Switch, Route, Link } from "wouter";

export default function App() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Routes smoke test</h1>
      <nav style={{ display: "grid", gap: 8 }}>
        <Link href="/">Home</Link>
        <Link href="/today">Today</Link>
      </nav>
      <Switch>
        <Route path="/">Home</Route>
        <Route path="/today">Today</Route>
        <Route>404</Route>
      </Switch>
    </div>
  );
}

