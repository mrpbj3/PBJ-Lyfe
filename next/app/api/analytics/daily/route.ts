// app/api/analytics/daily/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Missing ?date=" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    // MUST AUTH FIRST so auth.uid() works inside RPC
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // NOW call RPC with required parameter
    const { data, error } = await supabase.rpc(
      "get_daily_analytics",
      { _date: date }
    );

    if (error) {
      console.error("RPC ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
