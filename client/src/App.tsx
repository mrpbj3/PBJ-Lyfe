// PBJ Health - Main App (Supabase auth)
// Routing with wouter
import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { useAuth } from "@/auth/AuthProvider";      // <- from your provider
import RequireAuth from "@/auth/RequireAuth";       // <- simple guard

// pages
import Landing from "@/pages/landing";
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
import NotFound from "@/pages/not-found";

// auth pages you added in /auth
import Login from "@/auth/Login";
import AuthCallback from "@/auth/AuthCallback";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
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
