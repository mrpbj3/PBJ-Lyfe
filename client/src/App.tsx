// PBJ Health - Main App (Supabase auth)
// Routing with wouter
import React, { useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { useAuth } from "@/hooks/useAuth";      // <- use the hook from hooks (stable shape)
import RequireAuth from "@/auth/RequireAuth";  // <- simple guard
import { useProfile } from "@/hooks/useProfile"; // new hook for profile presence

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
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { profile, hasProfile, isLoading: profileLoading } = useProfile();
  const [location, navigate] = useLocation(); // location is current path string
  const currentPath = location;

  // Redirect logged-in users away from landing (/)
  useEffect(() => {
    // Only consider redirecting after auth is known
    if (authLoading) return;

    // If user is not authenticated, do nothing (keep them on landing)
    if (!isAuthenticated) {
      console.debug({
        isAuthenticated,
        hasProfile,
        currentPath,
        redirectedTo: "",
      });
      return;
    }

    // Determine if profile endpoint exists by checking whether profile returned null explicitly.
    // Our useProfile returns `profile === null` when the endpoint returned 404 (profile page doesn't exist yet).
    const profileEndpointExists = profile !== null; // null => endpoint missing (temp behavior)
    let target = "/today";

    if (profileEndpointExists) {
      // If endpoint exists, follow intended flow:
      // - hasProfile true -> /today
      // - hasProfile false -> onboarding
      target = hasProfile ? "/today" : "/onboarding/ProfileOnboarding";
    } else {
      // Profile endpoint not present yet — per temporary rule, route all logged-in users to /today
      target = "/today";
    }

    // Only redirect if the user is currently on landing or on login/callback pages
    const shouldRedirectFrom =
      currentPath === "/" ||
      currentPath === "/landing" ||
      currentPath === "/login" ||
      currentPath === "/auth/callback";

    let redirectedTo = "";

    if (shouldRedirectFrom && currentPath !== target) {
      // Use replace to avoid back-button bounce and to avoid redirect loops
      navigate(target, { replace: true });
      redirectedTo = target;
    }

    // Debug logging as requested
    console.debug({
      isAuthenticated,
      hasProfile,
      currentPath,
      redirectedTo,
    });

    // Note: intentionally leaving navigate in deps to ensure hook stability
  }, [isAuthenticated, authLoading, profile, profileLoading, hasProfile, currentPath, navigate]);

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
        <RequireAuth>
          <Today />
        </RequireAuth>
      </Route>
      <Route path="/sleep">
        <RequireAuth>
          <Sleep />
        </RequireAuth>
      </Route>
      <Route path="/weight">
        <RequireAuth>
          <Weight />
        </RequireAuth>
      </Route>
      <Route path="/meals">
        <RequireAuth>
          <Meals />
        </RequireAuth>
      </Route>
      <Route path="/workouts">
        <RequireAuth>
          <Workouts />
        </RequireAuth>
      </Route>
      <Route path="/mental">
        <RequireAuth>
          <Mental />
        </RequireAuth>
      </Route>
      <Route path="/meditation">
        <RequireAuth>
          <Meditation />
        </RequireAuth>
      </Route>
      <Route path="/dreams">
        <RequireAuth>
          <Dreams />
        </RequireAuth>
      </Route>
      <Route path="/work">
        <RequireAuth>
          <Work />
        </RequireAuth>
      </Route>
      <Route path="/social">
        <RequireAuth>
          <Social />
        </RequireAuth>
      </Route>
      <Route path="/hobbies">
        <RequireAuth>
          <Hobbies />
        </RequireAuth>
      </Route>
      <Route path="/recovery">
        <RequireAuth>
          <Recovery />
        </RequireAuth>
      </Route>
      <Route path="/profile">
        <RequireAuth>
          <Profile />
        </RequireAuth>
      </Route>
      <Route path="/onboarding/ProfileOnboarding">
        <RequireAuth>
          <ProfileSetup />
        </RequireAuth>
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
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}