import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/auth/AuthProvider';
import { supabase } from '@/lib/supabase';

export default function ProfileSetup() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const [firstName, setFirstName] = useState(user?.user_metadata?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.user_metadata?.last_name ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading profile…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-2xl font-semibold">Please sign in to continue</h2>
          <p className="text-sm text-muted-foreground">We couldn't detect an active session.</p>
          <Link href="/login">
            <button className="mt-4 px-4 py-2 rounded bg-[#AB13E6] text-white">Sign in / Sign up</button>
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Upsert the profile row (id = user.id)
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: user.id,
        first_name: firstName || null,
        last_name: lastName || null,
        // add other fields here as you extend the onboarding form
      }, { onConflict: 'id' });

      if (upsertError) {
        console.error('profile upsert error', upsertError);
        setError(upsertError.message || 'Failed to save profile');
        setSubmitting(false);
        return;
      }

      // After profile is created, navigate to Today
      navigate('/today', { replace: true });
    } catch (err: any) {
      console.error('profile setup exception', err);
      setError(err?.message ?? 'An unknown error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold">Profile Setup</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-4">Welcome — set up your profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">First name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="First name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Last name</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="Last name"
            />
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 rounded bg-[#AB13E6] text-white disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Complete Profile'}
            </button>
            <Link href="/today">
              <button type="button" className="px-4 py-2 rounded border">
                Skip for now
              </button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
