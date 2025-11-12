// PBJ Health - Streak Logic
// Calculate streaks based on daily performance

export interface DailyData {
  date: string;
  calorie_ratio: number | null;
  sleep_hours: number | null;
  did_workout: boolean;
  streak_color?: "green" | "yellow" | "red";
}

export interface StreakResult {
  streak: number;
  color: "green" | "yellow" | "red";
  message: string;
}

export function calculateStreak(dailyData: DailyData[]): StreakResult {
  let streak = 0;
  let color: "green" | "yellow" | "red" = "red";

  for (const day of dailyData) {
    const score =
      (day.calorie_ratio !== null && day.calorie_ratio <= 1.0 ? 1 : 0) +
      (day.sleep_hours !== null && day.sleep_hours >= 6 ? 1 : 0) +
      (day.did_workout ? 1 : 0);

    day.streak_color = score === 3 ? "green" : score === 2 ? "yellow" : "red";

    if (day.streak_color === "red") break;
    streak++;
    color = day.streak_color;
  }

  let message = "";
  if (color === "green")
    message = `GREEN STREAK LENGTH: ${streak} DAYS. GOOD JOB! Congrats on another great day. Let's keep the streak going!`;
  else if (color === "yellow")
    message = `STREAK LENGTH: ${streak} DAYS. GOOD JOB KEEPING THE STREAK ALIVE! LET'S AIM FOR A GREAT DAY TOMORROW.`;
  else
    message =
      streak > 0
        ? `RED STREAK LENGTH: ${streak} DAYS. You said "better." Time to mean it.`
        : `RED STREAK LENGTH: 0 DAYS. AW MAN, we lost our streak! Let's try to get it back tomorrow.`;

  return { streak, color, message };
}
