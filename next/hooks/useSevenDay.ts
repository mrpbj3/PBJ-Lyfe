// hooks/useSevenDay.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export interface SevenDayData {
  date: string;
  sleepHours: number | null;
  weightKg: number | null;
  workoutMin: number;
  calories: number;
  kcalTarget: number;
  sleepTarget: number;
}

export function useSevenDay(userId: string | undefined) {
  return useQuery<SevenDayData[]>({
    queryKey: ["analytics-7d", userId],
    queryFn: async () => {
      const raw = await apiClient("/api/analytics/7d");

      return raw.map((r: any) => ({
        date: r.date,
        sleepHours: r.sleep_hours !== null ? Number(r.sleep_hours) : null,
        weightKg: r.weight_kg !== null ? Number(r.weight_kg) : null,
        workoutMin: r.workout_min !== null ? Number(r.workout_min) : 0,
        calories: Number(r.calories),
        kcalTarget: Number(r.kcal_target),
        sleepTarget: Number(r.sleep_target),
      }));
    },
    enabled: !!userId,
  });
}
