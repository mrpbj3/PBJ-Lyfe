"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const createBrowserSupabaseClient = () => {
  return createClientComponentClient();
};

export const supabase = createBrowserSupabaseClient();
