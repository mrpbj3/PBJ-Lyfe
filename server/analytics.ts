// server/analytics.ts
import { supabase } from "./supabase";

/**
 * Get daily analytics for a specific user and date using RPC
 * Uses the get_daily_analytics Supabase function
 */
export async function getDailyAnalytics(userId: string, date: string) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    if (!supabaseUrl) {
      console.log("Supabase not configured, returning mock analytics data");
      return {
        date,
        sleepHours: 7.5,
        calories: 2000,
        workouts: 1,
        weight: null,
        scoreSmall: 3,
        kcalGoal: 2000,
        steps: 0,
        streakColor: 'green',
      };
    }

    // Call the RPC function
    const { data, error } = await supabase.rpc('get_daily_analytics', { _date: date });

    if (error) {
      console.error("Error calling get_daily_analytics RPC:", error);
      throw error;
    }

    // Map the response to camelCase
    if (data && data.length > 0) {
      const row = data[0];
      return {
        date: row.date,
        sleepHours: row.sleep_hours || 0,
        calories: row.calories || 0,
        workouts: row.workouts || 0,
        weight: row.weight || null,
        kcalGoal: row.kcal_goal || 2000,
        steps: row.steps || 0,
        streakColor: row.streak_color || 'red',
        scoreSmall: calculateScoreSmall(row),
      };
    }

    // Return empty data if nothing found
    return {
      date,
      sleepHours: 0,
      calories: 0,
      workouts: 0,
      weight: null,
      scoreSmall: 0,
      kcalGoal: 2000,
      steps: 0,
      streakColor: 'red',
    };
  } catch (error) {
    console.error("Error fetching daily analytics:", error);
    throw error;
  }
}

/**
 * Calculate Big 3 score (0-3) from daily data
 */
function calculateScoreSmall(row: any): number {
  let score = 0;
  if ((row.sleep_hours || 0) >= 6) score++;
  if ((row.calories || 0) > 0 && (row.kcal_goal || 2000) > 0) {
    const ratio = row.calories / row.kcal_goal;
    if (ratio >= 0.9 && ratio <= 1.1) score++;
  }
  if ((row.workouts || 0) > 0) score++;
  return score;
}

/**
 * Get 7-day analytics for visualizations using RPC
 * Uses the get_7day_analytics Supabase function which uses auth.uid() internally
 */
export async function get7DayAnalytics(userId: string) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    if (!supabaseUrl) {
      console.log("Supabase not configured, returning mock 7-day analytics");
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          sleepHours: 7 + Math.random() * 2,
          weightKg: null,
          workoutMin: Math.random() > 0.5 ? 45 : 0,
          calories: 1800 + Math.random() * 400,
          kcalTarget: 2000,
          sleepTarget: 480,
        });
      }
      return result;
    }

    // For server-side, we need to query directly since we have service key
    // The RPC function get_7day_analytics() uses auth.uid() which won't work server-side
    // So we query daily_summary directly
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);

    const end = endDate.toISOString().split('T')[0];
    const start = startDate.toISOString().split('T')[0];

    // Get profile for targets
    const { data: profile } = await supabase
      .from('profiles')
      .select('calorie_target, sleep_target_minutes')
      .eq('id', userId)
      .single();

    const kcalTarget = profile?.calorie_target || 2000;
    const sleepTarget = profile?.sleep_target_minutes || 480;

    // Get daily_summary data
    const { data: summaryData, error } = await supabase
      .from('daily_summary')
      .select('summary_date, sleep_hours, weight_kg, workout_minutes, calories_total, calorie_target')
      .eq('user_id', userId)
      .gte('summary_date', start)
      .lte('summary_date', end)
      .order('summary_date', { ascending: true });

    if (error) {
      console.error("Error fetching 7-day analytics:", error);
      throw error;
    }

    // Initialize result array with all dates
    const result: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Find matching summary data
      const dayData = summaryData?.find(s => s.summary_date === dateStr);
      
      result.push({
        date: dateStr,
        sleepHours: dayData?.sleep_hours || null,
        weightKg: dayData?.weight_kg || null,
        workoutMin: dayData?.workout_minutes || 0,
        calories: dayData?.calories_total || 0,
        kcalTarget: dayData?.calorie_target || kcalTarget,
        sleepTarget,
      });
    }

    return result;
  } catch (error) {
    console.error("Error fetching 7-day analytics:", error);
    throw error;
  }
}
