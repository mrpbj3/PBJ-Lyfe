import { Route, Switch, Link } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Use a local QueryClient so we don't depend on project-specific imports yet.
// (We can swap back to "@/lib/queryClient" after the app is up.)
const qc = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>PBJ Lyfe — Online</h1>
        <p style={{ marginBottom: 16 }}>
          If you see this, React + Vite + routing are good. Next we reintroduce your providers/auth.
        </p>
        <nav style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          <Link href="/">Home</Link>
          <Link href="/today">Today</Link>
          <Link href="/app">DecisionGate</Link>
        </nav>
        <Switch>
          <Route path="/">Home</Route>
          <Route path="/today">Today</Route>
          <Route path="/app">DecisionGate placeholder</Route>
          <Route>404</Route>
        </Switch>
      </div>
    </QueryClientProvider>
  );
}
