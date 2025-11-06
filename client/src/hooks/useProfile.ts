import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  [k: string]: any;
};

/**
 * useProfile(userId?)
 * - If userId is provided (and isn't "me"), fetches that profile by id.
 * - If userId is omitted or "me", fetches the profile for the currently authenticated user.
 * - Query key: ["profile", userIdOrMe] — stable and consistent for caching.
 */
export function useProfile(userId?: string | "me") {
  const key = ["profile", userId ?? "me"];

  return useQuery<Profile | null>(key, async () => {
    // If an explicit userId was supplied and it's not "me", fetch that id.
    if (userId && userId !== "me") {
      const { data, error } = await supabase
        .from<Profile>("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    }

    // Otherwise use the currently authenticated user.
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) throw userErr;
    if (!user) return null;

    const { data, error } = await supabase
      .from<Profile>("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    return data;
  });
}