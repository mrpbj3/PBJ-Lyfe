"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  createBrowserClient,
  type SupabaseClient,
  type Session,
  type User,
} from "@supabase/ssr";
import { useRouter } from "next/navigation";

// ----------- CONTEXT TYPES -------------
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

// ----------- SUPABASE CLIENT (BROWSER) -------------
function getClient(): SupabaseClient {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ----------- AUTOMATIC PROFILE CREATION -------------
async function ensureBootstrap(user: User) {
  try {
    const supabase = getClient();
    const { error } = await supabase.rpc("create_profile", { _id: user.id });
    if (error) console.warn("Profile bootstrap failed:", error.message);
  } catch (e) {
    console.error("bootstrap error:", e);
  }
}

// ----------- PROVIDER IMPLEMENTATION -------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [supabase] = useState(() => getClient());
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------
  // RESTORE SESSION ON PAGE LOAD (SSR + CSR SUPPORT)
  // -------------------------------------------------
  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;

        setSession(data.session ?? null);

        if (data.session?.user) {
          ensureBootstrap(data.session.user);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    init();

    // -------------------------------------------------
    // LISTEN FOR AUTH CHANGES
    // -------------------------------------------------
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession ?? null);

        if (newSession?.user) {
          ensureBootstrap(newSession.user);
        }
      }
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  // -------------------------------------------------
  // SIGN OUT
  // -------------------------------------------------
  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const value: AuthContextType = {
    user: session?.user ?? null,
    session,
    loading,
    isLoading: loading,
    isAuthenticated: !!session?.user,
    signOut,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
