import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function createServerSupabase() {
  const cookieStore = cookies();

  // Use SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY if available (Production)
  // Otherwise fall back to NEXT_PUBLIC_* vars (Preview/Development)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase configuration missing:", { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseKey 
    });
  }

  return createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // ignore — safe in server-only environments
          }
        }
      }
    }
  );
}
