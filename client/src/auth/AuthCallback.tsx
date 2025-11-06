// client/src/auth/AuthCallback.tsx
import { useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [, navigate] = useLocation();

  useEffect(() => {
    let mounted = true;

    async function finalize() {
      try {
        // If you are using PKCE / ?code=... flows, uncomment this:
        // await supabase.auth.exchangeCodeForSession(window.location.href);

        // For email magic links, Supabase will have set the session if the hash was valid.
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error || !data.session) {
          toast({
            title: "Sign-in link invalid or expired",
            description: "Please request a new login link.",
          });
          navigate("/login", { replace: true });
          return;
        }

        // Success → hand off to decision gate
        navigate("/app", { replace: true });
      } catch (e: any) {
        toast({
          title: "Couldn’t finish sign-in",
          description: e.message ?? "Please try again.",
        });
        navigate("/login", { replace: true });
      }
    }

    finalize();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center text-muted-foreground">
      Finishing sign-in…
    </div>
  );
}
