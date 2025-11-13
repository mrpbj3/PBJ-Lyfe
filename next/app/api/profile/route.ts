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

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      // Return safe defaults if profile not found
      return NextResponse.json({
        id: user.id,
        first_name: "",
        last_name: "",
        starting_weight: 0,
        units_weight: "lbs",
        starting_height_cm: 0,
        units_height: "cm",
        calorie_target: 2000,
        sleep_target_minutes: 480,
        workout_days_target: 3,
        profile_color: "#3B82F6",
        timezone: "America/New_York",
        date_format: "MM/DD/YYYY",
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
