import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getStreakFromDailySummary,
  type DailySummaryRow,
} from "@/lib/streakLogic";

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

    // Pull last 120 days to ensure we have enough data for streak calculation
    const since = new Date();
    since.setDate(since.getDate() - 120);
    const sinceISO = since.toISOString().split("T")[0];

    // Get data from daily_summary with all needed fields
    const { data: summaryData, error } = await supabase
      .from("daily_summary")
      .select(
        "summary_date, calories_total, calorie_target, sleep_hours, did_workout, streak_color"
      )
      .eq("user_id", userId)
      .gte("summary_date", sinceISO)
      .order("summary_date", { ascending: false });

    if (error) {
      console.error("Error fetching streak data:", error);
      return NextResponse.json(
        { error: "Failed to fetch streak data" },
        { status: 500 }
      );
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

    // For now, overall is the same as count
    return NextResponse.json({
      count: result.count,
      color: result.color,
      overall: result.count,
    });
  } catch (error) {
    console.error("Error calculating streak:", error);
    return NextResponse.json(
      { error: "Failed to calculate streak" },
      { status: 500 }
    );
  }
}
