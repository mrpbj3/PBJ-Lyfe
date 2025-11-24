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
    queryFn: () => apiClient("/api/analytics/7d"),
    enabled: !!userId,
  });
}
