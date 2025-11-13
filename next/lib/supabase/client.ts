// lib/supabase/client.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

// We MUST expose public URL + anon key or Supabase client won't initialize.
// These must be defined in Vercel as NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  (() => {
    console.warn("⚠️ Missing NEXT_PUBLIC_SUPABASE_URL — using fallback localhost.");
    return "http://localhost:54321";
  })();

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  (() => {
    console.warn("⚠️ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY — using fallback dummy key.");
    return "anon-test-key-not-secure";
  })();

// This is the only correct client for the browser.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
