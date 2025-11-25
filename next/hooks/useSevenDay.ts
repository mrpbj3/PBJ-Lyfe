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
    queryKey: ["analytics-7d"],
    queryFn: async () => {
      const raw = await apiClient("/api/analytics/7d");

      return raw.map((r: any) => ({
        date: r.date,
        sleepHours: Number(r
