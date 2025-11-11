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
      // Profile setup is optional, allow all authenticated users access
      setProfileComplete(true);
      setProfileLoading(false);
    }
  }, [loading, user, navigate]);

  if (loading || profileLoading) return <div className="p-6">Loading…</div>;
  if (!user || !profileComplete) return null;
  return <>{children}</>;
}
