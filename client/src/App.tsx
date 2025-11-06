// App.tsx
import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";

import Landing from "@/pages/landing";
import Today from "@/pages/today";
import ProfileOnboarding from "@/pages/onboarding/ProfileOnboarding";
import NotFound from "@/pages/not-found";
import AuthCallback from "@/auth/AuthCallback"; // if you have one for hash parsing

import Login from "@/pages/Login";
import AuthCallback from "@/auth/AuthCallback";
// ...
<Switch>
  {/* public */}
  <Route path="/" component={Landing} />
  <Route path="/login" component={Login} />
  <Route path="/auth/callback" component={AuthCallback} />
  {/* ... other routes */}
  <Route component={NotFound} />
</Switch>

function DecisionGate() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // NOTE: you already use react-query; this hook uses supabase to fetch profile
  // see hook code just below
  const { data: profile, isLoading: pLoading } = useProfile(); 

  // Loading UI
  if (isLoading || pLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        Checking your profile…
      </div>
    );
  }

  // No auth → land
  if (!user) return <Redirect to="/" />;

  // First time or not finished → onboarding
  if (!profile || !profile.is_onboarding_complete) {
    navigate("/onboarding/profile");
    return null;
  }

  // All good → today
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
          <Route path="/auth/callback" component={AuthCallback} />

          {/* decision route after any login */}
          <Route path="/app" component={DecisionGate} />

          {/* protected app pages */}
          <Route path="/today" component={Today} />
          <Route path="/onboarding/profile" component={ProfileOnboarding} />

          {/* 404 */}
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
