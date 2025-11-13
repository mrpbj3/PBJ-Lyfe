// server/checkins.ts
import { supabase } from "./supabase";

/**
 * Get recent check-ins for a user
 * Returns empty array if not found or if Supabase is not configured
 */
export async function getRecentCheckins(userId: string, limit: number = 10) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    if (!supabaseUrl) {
      console.log("Supabase not configured, returning mock checkins data");
      // Return mock data for last 3 days
      const today = new Date();
      const mockCheckins = [];
      for (let i = 0; i < 3; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        mockCheckins.push({
          id: `mock-${i}`,
          user_id: userId,
          for_date: d.toISOString().split('T')[0],
          created_at: d.toISOString()
        });
      }
      return { data: mockCheckins, error: null };
    }

    const result = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", userId)
      .order("for_date", { ascending: false })
      .limit(limit);

    return result;
  } catch (error) {
    console.error("Error in getRecentCheckins:", error);
    return { data: [], error };
  }
}
