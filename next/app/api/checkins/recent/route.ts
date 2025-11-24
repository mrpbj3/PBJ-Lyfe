import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json([], { status: 401 });

  const { data, error } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", user.id)
    .order("for_date", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
