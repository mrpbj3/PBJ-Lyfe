import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();

  // MUST authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, ...fields } = body;

    if (!date) {
      return Response.json({ error: "Date is required" }, { status: 400 });
    }

    // Map camelCase to snake_case for database
    const dbFields: Record<string, any> = {
      user_id: user.id,
      summary_date: date,
    };

    if (fields.sleepHours !== undefined) dbFields.sleep_hours = fields.sleepHours;
    if (fields.weightKg !== undefined) dbFields.weight_kg = fields.weightKg;
    if (fields.workoutMinutes !== undefined) dbFields.workout_minutes = fields.workoutMinutes;
    if (fields.workoutBreakdown !== undefined) dbFields.workout_breakdown = fields.workoutBreakdown;
    if (fields.meditationMinutes !== undefined) dbFields.meditation_minutes = fields.meditationMinutes;
    if (fields.steps !== undefined) dbFields.steps = fields.steps;
    if (fields.mentalRating !== undefined) dbFields.mental_rating = fields.mentalRating;
    if (fields.workStressLevel !== undefined) dbFields.work_stress_level = fields.workStressLevel;
    if (fields.dreamType !== undefined) dbFields.dream_type = fields.dreamType;
    if (fields.dreamDesc !== undefined) dbFields.dream_desc = fields.dreamDesc;
    if (fields.socialMinutes !== undefined) dbFields.social_minutes = fields.socialMinutes;
    if (fields.hobbiesMinutes !== undefined) dbFields.hobbies_minutes = fields.hobbiesMinutes;
    if (fields.drugUseFlag !== undefined) dbFields.drug_use_flag = fields.drugUseFlag;
    if (fields.caloriesTotal !== undefined) dbFields.calories_total = fields.caloriesTotal;
    if (fields.calorieTarget !== undefined) dbFields.calorie_target = fields.calorieTarget;

    // Calculate calorie ratio if both values are present
    if (dbFields.calories_total && dbFields.calorie_target) {
      dbFields.calorie_ratio = dbFields.calories_total / dbFields.calorie_target;
    }

    // Upsert the daily summary
    const { data, error } = await supabase
      .from("daily_summary")
      .upsert(dbFields, {
        onConflict: "user_id,summary_date",
      })
      .select()
      .single();

    if (error) {
      console.error("Daily summary upsert error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error("Daily summary error:", error);
    return Response.json({ error: "Failed to save daily summary" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const supabase = createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get date from query params
  const url = new URL(request.url);
  const date = url.searchParams.get("date");

  if (!date) {
    return Response.json({ error: "Date is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("daily_summary")
    .select("*")
    .eq("user_id", user.id)
    .eq("summary_date", date)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data || {});
}
