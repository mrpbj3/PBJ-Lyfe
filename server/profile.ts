// server/profile.ts
import { supabase } from "./supabase";

/**
 * Get user profile from Supabase
 * Returns null if not found or if Supabase is not configured
 */
export async function getProfile(userId: string) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    if (!supabaseUrl) {
      console.log("Supabase not configured, returning mock profile data");
      return {
        id: userId,
        first_name: "Demo",
        last_name: "User",
        starting_weight: 180,
        units_weight: "lbs",
        starting_height_cm: 175,
        units_height: "cm",
        calorie_target: 2000,
        sleep_target_minutes: 480,
        workout_days_target: 3,
        profile_color: "#3B82F6",
        timezone: "America/New_York",
        date_format: "MM/DD/YYYY"
      };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getProfile:", error);
    return null;
  }
}
