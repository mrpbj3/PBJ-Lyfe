import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "date query parameter is required" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Get user's calorie goal
    const { data: profile } = await supabase
      .from("profiles")
      .select("calorie_target")
      .eq("id", userId)
      .single();

    const kcalGoal = profile?.calorie_target || 2000;

    // Get sleep data for the date
    const { data: sleepData } = await supabase
      .from("sleep_sessions")
      .select("duration_min")
      .eq("user_id", userId)
      .gte("start_at", date)
      .lt(
        "start_at",
        new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      );

    const sleepHours = sleepData
      ? sleepData.reduce((sum, s) => sum + s.duration_min / 60, 0)
      : 0;

    // Get calories for the date
    const { data: mealsData } = await supabase
      .from("meals")
      .select("calories")
      .eq("user_id", userId)
      .eq("date", date);

    const calories = mealsData
      ? mealsData.reduce((sum, m) => sum + m.calories, 0)
      : 0;

    // Get workouts for the date
    const { data: workoutsData } = await supabase
      .from("workouts")
      .select("id")
      .eq("user_id", userId)
      .eq("date", date);

    const workouts = workoutsData ? workoutsData.length : 0;

    // Get weight for the date
    const { data: weightData } = await supabase
      .from("body_metrics")
      .select("weight_kg")
      .eq("user_id", userId)
      .eq("date", date)
      .single();

    const weight = weightData?.weight_kg || null;

    // Calculate Big 3 score (0-3)
    let scoreSmall = 0;
    if (sleepHours >= 6) scoreSmall++;
    if (calories > 0 && Math.abs(calories - kcalGoal) <= kcalGoal * 0.1)
      scoreSmall++;
    if (workouts > 0) scoreSmall++;

    return NextResponse.json({
      date,
      sleepHours: Number(sleepHours.toFixed(1)),
      calories,
      workouts,
      weight,
      scoreSmall,
      kcalGoal,
    });
  } catch (error) {
    console.error("Error fetching daily analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
