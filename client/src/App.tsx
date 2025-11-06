import React from "react";
import { Switch, Route, Redirect, Link } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import ProfileOnboarding from "@/pages/profile/onboarding";

const queryClient = new QueryClient();

export default function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-root">
        <Switch>
          <Route path="/">
            <Landing />
          </Route>

          <Route path="/login">
            <Login />
          </Route>

          <Route path="/onboarding">
            <ProfileOnboarding />
          </Route>

          <Route path="/old">
            <Redirect to="/" />
          </Route>

          <Route>
            <main style={{ padding: 20 }}>
              <h2>404 — Not found</h2>
              <p>
                <Link href="/">Go home</Link>
              </p>
            </main>
          </Route>
        </Switch>
      </div>
    </QueryClientProvider>
  );
}