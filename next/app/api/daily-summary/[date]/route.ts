import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  const supabase = createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = params;

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
