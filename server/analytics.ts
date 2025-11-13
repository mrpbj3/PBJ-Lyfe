// server/analytics.ts
import * as storage from "./storage";

/**
 * Get daily analytics for a specific user and date
 * Returns mock data if needed
 */
export async function getDailyAnalytics(userId: string, date: string) {
  try {
    // Use existing storage function to get analytics
    const analytics = await storage.getDailyAnalytics(userId, date);
    
    return {
      date: analytics.date,
      sleepHours: analytics.sleepHours,
      calories: analytics.calories,
      workouts: analytics.workouts,
      weight: analytics.weight,
      scoreSmall: analytics.scoreSmall,
      kcalGoal: analytics.kcalGoal,
    };
  } catch (error) {
    console.error("Error fetching daily analytics:", error);
    throw error;
  }
}
