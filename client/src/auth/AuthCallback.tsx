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

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, first_name")
        .eq("id", user.id)
        .maybeSingle();

      // If no profile yet or first_name not set, go to the profile page
      if (!profile || !profile.first_name) {
        navigate("/profile", { replace: true });
        return;
      }

      // Otherwise, go to dashboard (Today)
      navigate("/today", { replace: true });
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      Finishing sign-in…
    </div>
  );
}
