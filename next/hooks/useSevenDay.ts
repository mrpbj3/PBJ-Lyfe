// hooks/useSevenDay.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { SevenDayData } from "./useSevenDay.types";
import { apiClient } from "@/lib/apiClient";

export interface SevenDayData {
  date: string;          
  sleepHours: number | null;
  weightKg: number | null;
  calories: number;
  workoutMin: number;
  kcalTarget: number;
  sleepTarget: number;
}

export function useSevenDay(userId: string | undefined) {
  return useQuery<SevenDayData[]>({
    queryKey: ["analytics-7d", userId],
    enabled: !!userId,
    queryFn: async () => {
      const raw = await apiClient("/api/analytics/7d");

      // Convert snake_case → camelCase
      return raw.map((d: any) => ({
        date: d.date,
        sleepHours: d.sleep_hours ?? null,
        weightKg: d.weight_kg ?? null,
        calories: d.calories ?? 0,
        workoutMin: d.workout_min ?? 0,
        kcalTarget: d.kcal_target ?? 2000,
        sleepTarget: d.sleep_target ?? 8,
      }));
    },
  });
}
