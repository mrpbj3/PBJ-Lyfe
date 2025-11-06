import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile"; // added below

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

  if (!profile || !profile.is_onboarding_complete) {
    navigate("/onboarding/profile");
    return null;
  }

  navigate("/today");
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}
