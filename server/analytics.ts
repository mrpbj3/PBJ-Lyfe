// server/analytics.ts
import { supabase } from "./supabase";

/**
 * Get daily analytics for a specific user and date
 * Returns real Supabase data with sleep, calories, workouts, weight, and goals
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
      };
    }

    // Get user's calorie goal
    const { data: profile } = await supabase
      .from('profiles')
      .select('calorie_target')
      .eq('id', userId)
      .single();
    
    const kcalGoal = profile?.calorie_target || 2000;

    // Get sleep data for the date
    const { data: sleepData } = await supabase
      .from('sleep_sessions')
      .select('duration_min')
      .eq('user_id', userId)
      .gte('start_at', date)
      .lt('start_at', new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    
    const sleepHours = sleepData 
      ? sleepData.reduce((sum, s) => sum + (s.duration_min / 60), 0)
      : 0;

    // Get calories for the date
    const { data: mealsData } = await supabase
      .from('meals')
      .select('calories')
      .eq('user_id', userId)
      .eq('date', date);
    
    const calories = mealsData 
      ? mealsData.reduce((sum, m) => sum + m.calories, 0)
      : 0;

    // Get workouts for the date
    const { data: workoutsData } = await supabase
      .from('workouts')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date);
    
    const workouts = workoutsData ? workoutsData.length : 0;

    // Get weight for the date
    const { data: weightData } = await supabase
      .from('body_metrics')
      .select('weight_kg')
      .eq('user_id', userId)
      .eq('date', date)
      .single();
    
    const weight = weightData?.weight_kg || null;

    // Calculate Big 3 score (0-3)
    let scoreSmall = 0;
    if (sleepHours >= 6) scoreSmall++;
    if (calories > 0 && Math.abs(calories - kcalGoal) <= kcalGoal * 0.10) scoreSmall++;
    if (workouts > 0) scoreSmall++;

    return {
      date,
      sleepHours: Number(sleepHours.toFixed(1)),
      calories,
      workouts,
      weight,
      scoreSmall,
      kcalGoal,
    };
  } catch (error) {
    console.error("Error fetching daily analytics:", error);
    throw error;
  }
}

/**
 * Get 7-day analytics for visualizations
 * Returns array of daily data for the last 7 days
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
          sleepTarget: 7,
        });
      }
      return result;
    }

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
    const sleepTarget = (profile?.sleep_target_minutes || 420) / 60;

    // Initialize result array with all dates
    const result: any[] = [];
    for (let d = new Date(start); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        sleepHours: null,
        weightKg: null,
        workoutMin: 0,
        calories: 0,
        kcalTarget,
        sleepTarget
      });
    }

    // Get sleep data
    const { data: sleepData } = await supabase
      .from('sleep_sessions')
      .select('start_at, duration_min')
      .eq('user_id', userId)
      .gte('start_at', start)
      .lte('start_at', end);

    if (sleepData) {
      sleepData.forEach((session: any) => {
        const sleepDate = session.start_at.split('T')[0];
        const dayData = result.find(d => d.date === sleepDate);
        if (dayData) {
          dayData.sleepHours = (dayData.sleepHours || 0) + (session.duration_min / 60);
        }
      });
    }

    // Get weight data
    const { data: weightData } = await supabase
      .from('body_metrics')
      .select('date, weight_kg')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true });

    if (weightData) {
      weightData.forEach((metric: any) => {
        const dayData = result.find(d => d.date === metric.date);
        if (dayData) {
          dayData.weightKg = metric.weight_kg;
        }
      });
    }

    // Get workout data
    const { data: workoutData } = await supabase
      .from('workouts')
      .select('date, duration_min')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end);

    if (workoutData) {
      workoutData.forEach((workout: any) => {
        const dayData = result.find(d => d.date === workout.date);
        if (dayData) {
          dayData.workoutMin += workout.duration_min || 0;
        }
      });
    }

    // Get nutrition data
    const { data: mealsData } = await supabase
      .from('meals')
      .select('date, calories')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end);

    if (mealsData) {
      mealsData.forEach((meal: any) => {
        const dayData = result.find(d => d.date === meal.date);
        if (dayData) {
          dayData.calories += meal.calories || 0;
        }
      });
    }

    return result;
  } catch (error) {
    console.error("Error fetching 7-day analytics:", error);
    throw error;
  }
}
