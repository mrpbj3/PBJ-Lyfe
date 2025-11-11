import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/auth/AuthProvider";

export default function ProfileDetailed() {
  const { user } = useAuth();

  const { data: profile, refetch } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user?.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: checkins } = useQuery({
    queryKey: ["checkins", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_checkins")
        .select("id, for_date, submitted_at")
        .eq("user_id", user?.id)
        .order("for_date", { ascending: false })
        .limit(7);
      return data || [];
    },
    enabled: !!user,
  });

  const [edit, setEdit] = useState<any>({});

  if (!profile) return <div className="p-8">Loading…</div>;

  const save = async () => {
    await supabase.from("profiles").update(edit).eq("id", user?.id);
    await refetch();
    setEdit({});
  };

  const labelFor = (d:string) =>
    new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) + " Daily Check-In Results";

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold">Profile</h1>

      <div className="grid sm:grid-cols-2 gap-4">
        <Input defaultValue={profile.first_name || ""} onChange={(e)=>setEdit((x:any)=>({...x, first_name:e.target.value}))} placeholder="First name"/>
        <Input defaultValue={profile.last_name  || ""} onChange={(e)=>setEdit((x:any)=>({...x, last_name:e.target.value}))} placeholder="Last name"/>
        <Input defaultValue={profile.units_weight || ""} onChange={(e)=>setEdit((x:any)=>({...x, units_weight:e.target.value}))} placeholder="Units (weight)"/>
        <Input defaultValue={profile.units_height || ""} onChange={(e)=>setEdit((x:any)=>({...x, units_height:e.target.value}))} placeholder="Units (height)"/>
        <Input defaultValue={profile.calorie_target || ""} onChange={(e)=>setEdit((x:any)=>({...x, calorie_target:+e.target.value}))} placeholder="Calorie target"/>
        <Input defaultValue={profile.sleep_target_minutes || ""} onChange={(e)=>setEdit((x:any)=>({...x, sleep_target_minutes:+e.target.value}))} placeholder="Sleep target (min)"/>
        <Input defaultValue={profile.workout_days_target || ""} onChange={(e)=>setEdit((x:any)=>({...x, workout_days_target:+e.target.value}))} placeholder="Workout days / wk"/>
        <Input defaultValue={profile.profile_color || ""} onChange={(e)=>setEdit((x:any)=>({...x, profile_color:e.target.value}))} placeholder="Profile color hex"/>
      </div>
      <Button onClick={save} className="w-32">Save</Button>

      <h2 className="text-xl font-semibold mt-10">Recent Daily Check-Ins</h2>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-accent">
            <tr>
              <th className="text-left p-2">For Date</th>
              <th className="text-left p-2">Label</th>
            </tr>
          </thead>
          <tbody>
            {checkins?.map((c:any)=>(
              <tr key={c.id} className="hover:bg-muted cursor-pointer" onClick={()=> window.location.href = `/checkins/${c.id}`}>
                <td className="p-2">{c.for_date}</td>
                <td className="p-2">{labelFor(c.for_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="outline" onClick={()=> window.location.href = "/checkins/all"}>View All</Button>
    </div>
  );
}
