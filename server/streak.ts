// server/streak.ts
import { supabase } from "./supabase";
import { getStreakFromDailySummary, type DailySummaryRow } from "./streakLogic";

export interface CurrentStreakResult {
  count: number;
  color: 'green' | 'yellow' | 'red';
  overall: number;
}

/**
 * Get current streak for a user based on their daily summary data
 * Returns the active streak count, color, and overall streak count
 * Returns mock data if Supabase is not configured
 */
export async function getCurrentStreak(userId: string): Promise<CurrentStreakResult> {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    if (!supabaseUrl) {
      console.log("Supabase not configured, returning mock streak data");
      // Return mock data
      return {
        count: 3,
        color: 'green',
        overall: 5,
      };
    }

    // Pull last 120 days to ensure we have enough data for streak calculation
    const since = new Date();
    since.setDate(since.getDate() - 120);
    const sinceISO = since.toISOString().split('T')[0];
    
    // Get data from daily_summary with all needed fields
    const { data: summaryData, error } = await supabase
      .from('daily_summary')
      .select('summary_date, calories_total, calorie_target, sleep_hours, did_workout, streak_color')
      .eq('user_id', userId)
      .gte('summary_date', sinceISO)
      .order('summary_date', { ascending: false });

    if (error) {
      console.error("Error fetching streak data:", error);
      throw new Error("Failed to fetch streak data");
    }

    // Map to DailySummaryRow format
    const rows: DailySummaryRow[] = (summaryData || []).map((row: any) => ({
      summary_date: row.summary_date,
      calories_total: row.calories_total,
      calorie_target: row.calorie_target,
      sleep_hours: row.sleep_hours,
      did_workout: row.did_workout,
      streak_color: row.streak_color,
    }));

    // Calculate streak using the streak logic
    const result = getStreakFromDailySummary(rows);

    // For now, overall is the same as count (could be enhanced later)
    return {
      count: result.count,
      color: result.color,
      overall: result.count,
    };
  } catch (error) {
    console.error("Error calculating streak:", error);
    throw error;
  }
}
