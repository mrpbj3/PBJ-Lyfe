import { useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Supabase handles the hash in the URL and sets the session
    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        toast({ title: "Sign-in link invalid or expired." });
        navigate("/login");
      } else {
        navigate("/app");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center text-muted-foreground">
      Finishing sign-in…
    </div>
  );
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

      // If no profile yet, go to the onboarding/profile-setup page
      if (!profile) {
        navigate("/profile/setup", { replace: true });
        return;
      }

      // Otherwise, go to dashboard (Today)
      navigate("/", { replace: true });
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      Finishing sign-in…
    </div>
  );
}
