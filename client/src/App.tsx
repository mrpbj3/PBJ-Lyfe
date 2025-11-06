// PBJ Health – Main App (Vercel + Supabase Auth)
// Routes: public (Landing, /login, /auth/callback) + protected (app pages)

import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Supabase auth wiring
import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import RequireAuth from "@/auth/RequireAuth";
import Login from "@/auth/Login";
import AuthCallback from "@/auth/AuthCallback";

// Pages
import NotFound from "@/pages/not-found";
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
import Placeholder from "@/pages/placeholder";

// ---------- Small helpers ----------

// If logged in, send home to /today; else show landing
function HomeGate() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) return <LoadingScreen />;
  if (user) {
    navigate("/today");
    return null;
  }
  return <Landing />;
}

// If already logged in, skip /login
function LoginGate() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) return <LoadingScreen />;
  if (user) {
    navigate("/today");
    return null;
  }
  return <Login />;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading…</div>
    </div>
  );
}

// All protected app routes live under RequireAuth
function ProtectedApp() {
  return (
    <RequireAuth>
      <Switch>
        <Route path="/today" component={Today} />
        <Route path="/sleep" component={Sleep} />
        <Route path="/weight" component={Weight} />
        <Route path="/meals" component={Meals} />
        <Route path="/workouts" component={Workouts} />
        <Route path="/mental" component={Mental} />
        <Route path="/meditation" component={Meditation} />
        <Route path="/dreams" component={Dreams} />
        <Route path="/work" component={Work} />
        <Route path="/social" component={Social} />
        <Route path="/hobbies" component={Hobbies} />
        <Route path="/recovery" component={Recovery} />
        <Route path="/profile" component={Profile} />
        <Route path="/placeholder" component={Placeholder} />
        <Route component={NotFound} />
      </Switch>
    </RequireAuth>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={HomeGate} />
      <Route path="/login" component={LoginGate} />
      <Route path="/auth/callback" component={AuthCallback} />

      {/* Protected app */}
      <Route path="/today" component={ProtectedApp} />
      <Route path="/sleep" component={ProtectedApp} />
      <Route path="/weight" component={ProtectedApp} />
      <Route path="/meals" component={ProtectedApp} />
      <Route path="/workouts" component={ProtectedApp} />
      <Route path="/mental" component={ProtectedApp} />
      <Route path="/meditation" component={ProtectedApp} />
      <Route path="/dreams" component={ProtectedApp} />
      <Route path="/work" component={ProtectedApp} />
      <Route path="/social" component={ProtectedApp} />
      <Route path="/hobbies" component={ProtectedApp} />
      <Route path="/recovery" component={ProtectedApp} />
      <Route path="/profile" component={ProtectedApp} />
      <Route path="/placeholder" component={ProtectedApp} />

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
