import React, { useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider, useAuth } from "@/auth/AuthProvider"; // use context-based provider
import RequireAuth from "@/auth/RequireAuth";
import { useProfile } from "@/hooks/useProfile"; // supabase-based profile hook

// pages
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import AuthCallback from "@/auth/AuthCallback";
import Today from "@/pages/today";
import Sleep from "@/pages/sleep";
import Weight from "@/pages/weight";
import Meals from "@/pages/meals";
import Workouts from "@/pages/workouts";
import Mental from "@/pages/mental";
import Meditation from "@/pages/meditation";
import Dreams from "@/pages/dreams";
import Work from "@/pages/work";
import Social from "@/pages/social";
import Hobbies from "@/pages/hobbies";
import Recovery from "@/pages/recovery";
import Profile from "@/pages/profile";
import ProfileSetup from "@/pages/profile-setup";
import NotFound from "@/pages/not-found";

function Router() {
  // Use the AuthProvider's context (supabase client session)
  const { user, loading: authLoading } = useAuth();
  const { profile, hasProfile, isLoading: profileLoading } = useProfile();
  const [location, navigate] = useLocation();
  const currentPath = location;

  useEffect(() => {
    // Only act after auth state is known
    if (authLoading) return;

    const isAuthenticated = !!user;

    if (!isAuthenticated) {
      console.debug({
        isAuthenticated,
        hasProfile,
        currentPath,
        redirectedTo: "",
      });
      return;
    }

    // Determine target:
    // - while profile loading -> /today (temporary rule)
    // - profile exists -> /today
    // - profile missing -> onboarding
    const target = profileLoading ? "/today" : hasProfile ? "/today" : "/onboarding/ProfileOnboarding";

    // Only redirect from public pages (landing/login/callback)
    const shouldRedirectFrom =
      currentPath === "/" ||
      currentPath === "/landing" ||
      currentPath === "/login" ||
      currentPath === "/auth/callback";

    let redirectedTo = "";

    if (shouldRedirectFrom && currentPath !== target) {
      navigate(target, { replace: true });
      redirectedTo = target;
    }

    console.debug({
      isAuthenticated,
      hasProfile,
      currentPath,
      redirectedTo,
    });
  }, [user, authLoading, profile, profileLoading, hasProfile, currentPath, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/auth/callback" component={AuthCallback} />

      {/* Protected (wrap with RequireAuth) */}
      <Route path="/today">
        <RequireAuth><Today /></RequireAuth>
      </Route>
      <Route path="/sleep">
        <RequireAuth><Sleep /></RequireAuth>
      </Route>
      <Route path="/weight">
        <RequireAuth><Weight /></RequireAuth>
      </Route>
      <Route path="/meals">
        <RequireAuth><Meals /></RequireAuth>
      </Route>
      <Route path="/workouts">
        <RequireAuth><Workouts /></RequireAuth>
      </Route>
      <Route path="/mental">
        <RequireAuth><Mental /></RequireAuth>
      </Route>
      <Route path="/meditation">
        <RequireAuth><Meditation /></RequireAuth>
      </Route>
      <Route path="/dreams">
        <RequireAuth><Dreams /></RequireAuth>
      </Route>
      <Route path="/work">
        <RequireAuth><Work /></RequireAuth>
      </Route>
      <Route path="/social">
        <RequireAuth><Social /></RequireAuth>
      </Route>
      <Route path="/hobbies">
        <RequireAuth><Hobbies /></RequireAuth>
      </Route>
      <Route path="/recovery">
        <RequireAuth><Recovery /></RequireAuth>
      </Route>
      <Route path="/profile">
        <RequireAuth><Profile /></RequireAuth>
      </Route>
      <Route path="/onboarding/ProfileOnboarding">
        <RequireAuth><ProfileSetup /></RequireAuth>
      </Route>

      {/* Redirect any unknown /api/login legacy calls to /login */}
      <Route path="/api/login">
        <Redirect to="/login" />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  // Wrap the app with AuthProvider so useAuth everywhere is consistent
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}