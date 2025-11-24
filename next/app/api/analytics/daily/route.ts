import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = createServerSupabase();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    return Response.json({ error: "Missing ?date=" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("get_daily_analytics", {
    _date: date,
  });

  if (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data ?? []);
}
