// client/src/auth/AuthCallback.tsx
import { useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [, navigate] = useLocation();

  useEffect(() => {
    (async () => {
      // Finish the auth exchange for email links / OAuth
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (!code) {
        navigate("/login", { replace: true });
        return;
      }
      
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        // Send them back to login with an error state in the hash
        navigate(`/#error=${encodeURIComponent(error.message)}`, { replace: true });
        return;
      }

      // After we have a session, check if the user has a profile row
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        // If profile exists in table, go to today
        // If no profile or error, also go to today (lenient)
        navigate("/today", { replace: true });
      } catch (err) {
        console.log('Profile check error:', err);
        navigate("/today", { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      Finishing sign-in…
    </div>
  );
}
