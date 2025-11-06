import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type Ctx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};
const AuthCtx = createContext<Ctx>({ user: null, session: null, loading: true, signOut: async () => {} });
export const useAuth = () => useContext(AuthCtx);

async function ensureBootstrap(u: User) {
  // 1) profiles (PK=id)
  await supabase.from('profiles').upsert(
    { id: u.id, first_name: u.user_metadata?.first_name ?? null, last_name: u.user_metadata?.last_name ?? null },
    { onConflict: 'id' }
  );

  // 2) analysis_prefs (PK=user_id)
  await supabase.from('analysis_prefs').upsert({ user_id: u.id }, { onConflict: 'user_id' });

  // 3) privacy_prefs (PK=user_id)
  await supabase.from('privacy_prefs').upsert({ user_id: u.id }, { onConflict: 'user_id' });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // initial
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session ?? null);
      if (data.session?.user) await ensureBootstrap(data.session.user);
      setLoading(false);
    });

    // subscribe
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, s) => {
      setSession(s);
      if (s?.user) await ensureBootstrap(s.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signOut: async () => { await supabase.auth.signOut(); },
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}
