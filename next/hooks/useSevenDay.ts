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

// Generate an array of the last 7 days (including today)
function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date.toISOString().split('T')[0]);
  }
  return days;
}

export function useSevenDay(userId: string | undefined) {
  return useQuery<SevenDayData[]>({
    queryKey: ["analytics-7d", userId],
    staleTime: 0, // Always consider data stale
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gets focus
    queryFn: async () => {
      const raw = await apiClient("/api/analytics/7d");
      
      // Create a map of existing data by date
      const dataByDate = new Map<string, any>();
      if (Array.isArray(raw)) {
        raw.forEach((r: any) => {
          dataByDate.set(r.date, r);
        });
      }
      
      // Get default values (from first record or use defaults)
      const defaultKcalTarget = raw?.[0]?.kcal_target || 2000;
      const defaultSleepTarget = raw?.[0]?.sleep_target || 7;
      
      // Generate all 7 days, filling in missing days with null/0 values
      const last7Days = getLast7Days();
      
      return last7Days.map((date) => {
        const existing = dataByDate.get(date);
        if (existing) {
          return {
            date: existing.date,
            sleepHours: existing.sleep_hours !== null ? Number(existing.sleep_hours) : null,
            weightKg: existing.weight_kg !== null ? Number(existing.weight_kg) : null,
            workoutMin: existing.workout_min !== null ? Number(existing.workout_min) : 0,
            calories: Number(existing.calories) || 0,
            kcalTarget: Number(existing.kcal_target) || defaultKcalTarget,
            sleepTarget: Number(existing.sleep_target) || defaultSleepTarget,
          };
        }
        // Return empty data for days with no input
        return {
          date,
          sleepHours: null,
          weightKg: null,
          workoutMin: 0,
          calories: 0,
          kcalTarget: defaultKcalTarget,
          sleepTarget: defaultSleepTarget,
        };
      });
    },
    enabled: !!userId,
  });
}
