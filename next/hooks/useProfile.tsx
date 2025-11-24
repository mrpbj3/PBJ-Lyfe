"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/auth/AuthProvider';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  profile_color: string;
  units_weight?: string;
  units_height?: string;
  timezone?: string;
  calorie_target?: number;
  sleep_target_minutes?: number;
}

interface ProfileContextType {
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  isLoading: true,
  error: null,
  refetch: async () => {},
});

export const useProfile = () => useContext(ProfileContext);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    if (!user?.id) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, profile_color, units_weight, units_height, timezone, calorie_target, sleep_target_minutes')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Profile load error', fetchError);
        setError(fetchError as Error);
        // Set safe defaults when profile doesn't exist yet
        setProfile({
          id: user.id,
          first_name: '',
          last_name: '',
          profile_color: '#AB13E6',
          units_weight: 'lb',
          units_height: 'ft/in',
          timezone: 'America/New_York',
          calorie_target: 2000,
          sleep_target_minutes: 480,
        });
      } else {
        setProfile({
          ...data,
          profile_color: data?.profile_color || '#AB13E6',
          units_weight: data?.units_weight || 'lb',
          units_height: data?.units_height || 'ft/in',
          timezone: data?.timezone || 'America/New_York',
          calorie_target: data?.calorie_target || 2000,
          sleep_target_minutes: data?.sleep_target_minutes || 480,
        });
      }
    } catch (err) {
      console.error('Profile load error', err);
      setError(err as Error);
      // Set safe defaults on exception
      setProfile({
        id: user.id,
        first_name: '',
        last_name: '',
        profile_color: '#AB13E6',
        units_weight: 'lb',
        units_height: 'ft/in',
        timezone: 'America/New_York',
        calorie_target: 2000,
        sleep_target_minutes: 480,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfile();
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [user?.id, isAuthenticated]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isLoading,
        error,
        refetch: fetchProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
