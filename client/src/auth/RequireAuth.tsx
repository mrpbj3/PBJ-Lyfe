import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }

    if (!loading && user) {
      (async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, first_name")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile || !profile.first_name) {
          navigate('/profile/setup');
        } else {
          setProfileComplete(true);
        }
        setProfileLoading(false);
      })();
    }
  }, [loading, user, navigate]);

  if (loading || profileLoading) return <div className="p-6">Loading…</div>;
  if (!user || !profileComplete) return null;
  return <>{children}</>;
}
