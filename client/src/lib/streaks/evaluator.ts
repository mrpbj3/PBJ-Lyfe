// PBJ Health - Streak Evaluator
// Uses daily_summary table to calculate user streaks
import { supabase } from "@/lib/supabase";

export async function calculateUserStreak(userId: string) {
  const { data, error } = await supabase
    .from("daily_summary")
    .select("summary_date, calorie_ratio, sleep_hours, did_workout")
    .eq("user_id", userId)
    .order("summary_date", { ascending: false })
    .limit(60);

  if (error || !data) return { streak: 0, color: "red", msg: "No data." };

  let streak = 0;
  let last: "green" | "yellow" | "red" = "red";

  for (const d of data) {
    const score =
      (d.calorie_ratio !== null && d.calorie_ratio <= 1 ? 1 : 0) +
      (d.sleep_hours !== null && d.sleep_hours >= 6 ? 1 : 0) +
      (d.did_workout ? 1 : 0);
    const color = score === 3 ? "green" : score === 2 ? "yellow" : "red";
    if (color === "red") break;
    streak++;
    last = color;
  }

  const msg =
    last === "green"
      ? `GREEN STREAK LENGTH: ${streak} DAYS. GOOD JOB! Congrats on another great day. Lets keep the streak going!`
      : last === "yellow"
      ? `STREAK LENGTH: ${streak} DAYS. GOOD JOB KEEPING THE STREAK ALIVE! LETS AIM FOR A GREAT DAY TOMORROW.`
      : streak > 0
      ? `RED STREAK LENGTH: ${streak} DAYS. You said "better." Time to mean it.`
      : `RED STREAK LENGTH: 0 DAYS. AW MAN, we lost our streak! Lets try to get it back tomorrow`;

  return { streak, color: last, msg };
}
