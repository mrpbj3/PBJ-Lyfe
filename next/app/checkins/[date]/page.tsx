import { createServerSupabase } from "@/lib/supabase/server";

export default async function CheckinPage({ params }: { params: { date: string } }) {
  const supabase = createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-6">Not authorized.</div>;
  }

  const { data, error } = await supabase
    .from("daily_summary")
    .select("*")
    .eq("user_id", user.id)
    .eq("summary_date", params.date)
    .single();

  if (error || !data) {
    return <div className="p-6">No data found for {params.date}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{params.date} Daily Check-In</h1>

      <pre className="bg-muted p-4 rounded-lg text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
