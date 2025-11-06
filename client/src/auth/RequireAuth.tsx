import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from './AuthProvider';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!user) return null;
  return <>{children}</>;
}
