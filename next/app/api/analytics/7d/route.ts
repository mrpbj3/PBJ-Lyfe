import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);

    const end = endDate.toISOString().split("T")[0];
    const start = startDate.toISOString().split("T")[0];

    // Get profile for targets
    const { data: profile } = await supabase
      .from("profiles")
      .select("calorie_target, sleep_target_minutes")
      .eq("id", userId)
      .single();

    const kcalTarget = profile?.calorie_target || 2000;
    const sleepTarget = (profile?.sleep_target_minutes || 420) / 60;

    // Initialize result array with all dates
    const result: any[] = [];
    for (
      let d = new Date(start);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split("T")[0];
      result.push({
        date: dateStr,
        sleepHours: null,
        weightKg: null,
        workoutMin: 0,
        calories: 0,
        kcalTarget,
        sleepTarget,
      });
    }

    // Get sleep data
    const { data: sleepData } = await supabase
      .from("sleep_sessions")
      .select("start_at, duration_min")
      .eq("user_id", userId)
      .gte("start_at", start)
      .lte("start_at", end);

    if (sleepData) {
      sleepData.forEach((session: any) => {
        const sleepDate = session.start_at.split("T")[0];
        const dayData = result.find((d) => d.date === sleepDate);
        if (dayData) {
          dayData.sleepHours =
            (dayData.sleepHours || 0) + session.duration_min / 60;
        }
      });
    }

    // Get weight data
    const { data: weightData } = await supabase
      .from("body_metrics")
      .select("date, weight_kg")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true });

    if (weightData) {
      weightData.forEach((metric: any) => {
        const dayData = result.find((d) => d.date === metric.date);
        if (dayData) {
          dayData.weightKg = metric.weight_kg;
        }
      });
    }

    // Get workout data
    const { data: workoutData } = await supabase
      .from("workouts")
      .select("date, duration_min")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end);

    if (workoutData) {
      workoutData.forEach((workout: any) => {
        const dayData = result.find((d) => d.date === workout.date);
        if (dayData) {
          dayData.workoutMin += workout.duration_min || 0;
        }
      });
    }

    // Get nutrition data
    const { data: mealsData } = await supabase
      .from("meals")
      .select("date, calories")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end);

    if (mealsData) {
      mealsData.forEach((meal: any) => {
        const dayData = result.find((d) => d.date === meal.date);
        if (dayData) {
          dayData.calories += meal.calories || 0;
        }
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching 7d analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
