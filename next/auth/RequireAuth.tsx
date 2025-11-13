"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase/client';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (!loading && user) {
      // Profile setup is optional, allow all authenticated users access
      setProfileComplete(true);
      setProfileLoading(false);
    }
  }, [loading, user, router]);

  if (loading || profileLoading) return <div className="p-6">Loading…</div>;
  if (!user || !profileComplete) return null;
  return <>{children}</>;
}
