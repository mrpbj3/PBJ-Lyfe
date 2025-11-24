import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = createRouteClient();

    // Get the logged-in user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Correct column name is for_date — NOT date
    const { data, error } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", user.id)
      .order("for_date", { ascending: false })
      .limit(5);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
