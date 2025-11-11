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
        // Check if profile exists and is completed
        // If table doesn't exist or there's an error, allow access
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("id, first_name")
            .eq("id", user.id)
            .maybeSingle();

          // Only redirect to profile if we successfully found an incomplete profile
          if (!error && profile && !profile.first_name) {
            navigate('/profile');
          } else {
            // Allow access in all other cases
            setProfileComplete(true);
          }
        } catch (err) {
          // If there's any error checking profile, allow access
          console.log('Profile check skipped:', err);
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
