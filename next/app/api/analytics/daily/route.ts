import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createServerSupabase();

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    return Response.json({ error: "Missing ?date=YYYY-MM-DD" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase.rpc("get_daily_analytics", {
      _date: date,
    });

    if (error) {
      console.error("Supabase daily error", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error: any) {
    console.error("Supabase daily error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
