// PBJ Health - Main App
// Reference: Replit Auth blueprint for routing
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Unauthenticated routes
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route>
          {() => {
            // Redirect any protected route to login
            window.location.href = '/api/login';
            return null;
          }}
        </Route>
      </Switch>
    );
  }

  // Authenticated routes
  return (
    <Switch>
      <Route path="/" component={Today} />
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
