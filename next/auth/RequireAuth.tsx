"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase/client";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  const [checkingProfile, setCheckingProfile] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  // --------------------
  // Debug
  // --------------------
  console.log("=== REQUIRE AUTH ===");
  console.log("USER:", user);
  console.log("AUTH LOADING:", isLoading);
  console.log("AUTHENTICATED:", isAuthenticated);

  // --------------------
  // Handle Loading
  // --------------------
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading authentication…</div>
      </div>
    );
  }

  // --------------------
  // If not logged in → send to login
  // --------------------
  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  // --------------------
  // Check profile completeness
  // --------------------
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user?.id)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error("Profile lookup error:", error.message);
        setProfileComplete(true); // allow entry anyway
      } else {
        setProfileComplete(!!data?.id);
      }

      setCheckingProfile(false);
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Checking profile…</div>
      </div>
    );
  }

  return <>{children}</>;
}
