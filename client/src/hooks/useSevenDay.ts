// hooks/useSevenDay.ts
// Fetch 7-day analytics data
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface SevenDayData {
  date: string; // YYYY-MM-DD
  sleepHours: number | null;
  weightKg: number | null;
  workoutMin: number;
  calories: number;
  kcalTarget: number;
  sleepTarget: number;
}

export function useSevenDay(userId: string | undefined) {
  return useQuery<SevenDayData[]>({
    queryKey: ['/api/analytics/7d'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/analytics/7d');
      return response as SevenDayData[];
    },
    enabled: !!userId,
  });
}
