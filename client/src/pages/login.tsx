import React, { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function Login(): JSX.Element {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAuth(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSigningUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: pw,
        });
        if (signUpError) throw signUpError;
        // After sign-up, redirect to onboarding or inform user to verify email.
        setLocation("/onboarding");
        return;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: pw,
        });
        if (signInError) throw signInError;
        setLocation("/onboarding");
      }
    } catch (err: any) {
      setError(err?.message ?? "Authentication error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form className="w-full max-w-md bg-white p-6 rounded shadow" onSubmit={handleAuth}>
        <h2 className="text-xl font-semibold mb-4">{isSigningUp ? "Sign up" : "Sign in"}</h2>

        <label className="block mb-2 text-sm">
          Email
          <input
            className="mt-1 block w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
          />
        </label>

        <label className="block mb-4 text-sm">
          Password
          <input
            className="mt-1 block w-full"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            type="password"
          />
        </label>

        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded"
            disabled={loading}
          >
            {loading ? "Please wait..." : isSigningUp ? "Create account" : "Sign in"}
          </button>

          <button
            type="button"
            className="text-sm underline"
            onClick={() => setIsSigningUp((s) => !s)}
          >
            {isSigningUp ? "Have an account? Sign in" : "New? Create account"}
          </button>
        </div>
      </form>
    </main>
  );
}