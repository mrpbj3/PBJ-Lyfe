// client/src/auth/AuthCallback.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // Finish the auth exchange for email links / OAuth
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (!code) {
        router.replace("/login");
        return;
      }
      
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        // Send them back to login with an error state in the hash
        router.replace(`/#error=${encodeURIComponent(error.message)}`);
        return;
      }

      // After we have a session, check if the user has a profile row
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, first_name")
          .eq("id", user.id)
          .maybeSingle();

        // If profile exists but first_name is not set, redirect to profile for setup
        if (profile && !profile.first_name) {
          router.replace("/profile");
          return;
        }

        // If profile exists with first_name, go to today
        // If no profile or error, also go to today (lenient)
        router.replace("/today");
      } catch (err) {
        console.log('Profile check error:', err);
        router.replace("/today");
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      Finishing sign-in…
    </div>
  );
}
