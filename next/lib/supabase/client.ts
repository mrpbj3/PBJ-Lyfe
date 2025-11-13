"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const createBrowserSupabaseClient = () => {
  // Gracefully handle missing env vars during build
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    // Return a mock client during build
    return null as any;
  }
  
  return createClientComponentClient();
};

export const supabase = createBrowserSupabaseClient();
