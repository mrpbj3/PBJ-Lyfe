import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type Ctx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
};
const AuthCtx = createContext<Ctx>({ 
  user: null, 
  session: null, 
  loading: true, 
  isLoading: true,
  isAuthenticated: false,
  signOut: async () => {} 
});
export const useAuth = () => useContext(AuthCtx);

async function ensureBootstrap(u: User) {
  // Bootstrap function - silently fail if tables don't exist
  // This allows the app to work even if Supabase tables aren't set up
  try {
    // 1) profiles (PK=id) - try to create if doesn't exist
    await supabase.from('profiles').upsert(
      { id: u.id, first_name: u.user_metadata?.first_name ?? null, last_name: u.user_metadata?.last_name ?? null },
      { onConflict: 'id' }
    );
  } catch (err) {
    // Silently ignore - table might not exist or have different schema
    console.log('Profile bootstrap skipped:', err);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const result = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(result.data.session ?? null);
        if (result.data.session?.user) {
          // bootstrap but fail silently so we don't block UI
          try {
            await ensureBootstrap(result.data.session.user);
          } catch (err) {
            console.error('bootstrap error', err);
          }
        }
      } catch (err) {
        console.error('Error fetching supabase session', err);
      } finally {
        // ALWAYS clear loading to avoid the app getting stuck on a blank loading screen
        if (mounted) setLoading(false);
      }
    })();

    // subscribe
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, s) => {
      try {
        setSession(s);
        if (s?.user) {
          try {
            await ensureBootstrap(s.user);
          } catch (err) {
            console.error('bootstrap on auth change error', err);
          }
        }
      } catch (err) {
        console.error('onAuthStateChange handler error', err);
      }
    });

    return () => {
      mounted = false;
      try {
        sub.subscription.unsubscribe();
      } catch { /* ignore */ }
    };
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        isLoading: loading,
        isAuthenticated: !!session?.user,
        signOut: async () => { await supabase.auth.signOut(); },
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}
