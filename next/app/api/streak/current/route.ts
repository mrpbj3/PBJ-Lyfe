import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerSupabase();

  try {
    const { data, error } = await supabase.rpc("get_current_streak");

    if (error) {
      console.error("Supabase streak error", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error: any) {
    console.error("Supabase streak error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
