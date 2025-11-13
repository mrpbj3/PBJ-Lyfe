"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Supabase SSR client creator
import { createBrowserClient } from "@supabase/ssr";

// Types come from supabase-js
import type { Session, User, SupabaseClient } from "@supabase/supabase-js";

// ---- Create a browser Supabase client ----
const supabase: SupabaseClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ---- Context Type ----
type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isLoading: true,
  isAuthenticated: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthCtx);

// ---- Ensure Profile Bootstrap ----
async function ensureProfile(user: User) {
  try {
    const { error } = await supabase.rpc("create_profile", { _id: user.id });
    if (error) console.error("Profile creation RPC failed:", error);
    else console.log("Profile ensured:", user.id);
  } catch (err) {
    console.error("Profile bootstrap error:", err);
  }
}

// ---- Provider ----
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // INITIAL SESSION LOAD
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(data.session ?? null);

        if (data.session?.user) {
          await ensureProfile(data.session.user);
        }
      } catch (err) {
        console.error("Error loading session:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // AUTH STATE CHANGES (login, logout, refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession ?? null);
        if (newSession?.user) {
          await ensureProfile(newSession.user);
        }
      }
    );

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Sign Out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const value: AuthContextType = {
    user: session?.user ?? null,
    session,
    loading,
    isLoading: loading,
    isAuthenticated: !!session?.user,
    signOut: handleSignOut,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
