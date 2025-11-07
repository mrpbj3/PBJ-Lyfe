// client/src/pages/profile-setup.tsx
import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileSetup() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold">Profile Setup</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-4">Welcome — set up your profile</h2>
        <p className="text-muted-foreground mb-6">This page is a simple placeholder for profile onboarding. Add your details to complete setup.</p>

        <div className="space-y-4">
          <Link href="/today">
            <button className="px-4 py-2 bg-[#AB13E6] text-white rounded">Skip for now — Go to Today</button>
          </Link>
        </div>
      </div>
    </div>
  );
}