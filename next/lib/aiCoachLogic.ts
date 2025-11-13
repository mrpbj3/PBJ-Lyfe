// PBJ Health - AI Coach Logic
// Generate summaries and answer user questions

import { supabase } from "@/lib/supabase/client";

export interface CoachResponse {
  summary: string;
  insights: string[];
  recommendations: string[];
}

/**
 * Ask Mr. PBJ for analysis over a specific date range
 * @param range Number of days to analyze (1, 7, 30, 90)
 * @param userId User ID to fetch data for
 * @returns AI-generated summary and recommendations
 */
export async function askMrPBJ(range: number, userId: string): Promise<string> {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - range);

    // Fetch user's daily analytics data
    const { data: dailyData, error } = await supabase
      .from("daily_summary")
      .select("*")
      .eq("user_id", userId)
      .gte("summary_date", startDate.toISOString().split('T')[0])
      .lte("summary_date", endDate.toISOString().split('T')[0])
      .order("summary_date", { ascending: false });

    if (error) {
      console.error("Error fetching data:", error);
      return "Sorry, I couldn't fetch your data. Please try again later.";
    }

    if (!dailyData || dailyData.length === 0) {
      return `I don't have any data for the ${range === 1 ? "previous day" : `last ${range} days`}. Start logging your activities to get personalized insights!`;
    }

    // Calculate averages and statistics
    const totalDays = dailyData.length;
    const avgSleep = dailyData.reduce((sum: number, day: any) => sum + (day.sleep_hours || 0), 0) / totalDays;
    const avgCalories = dailyData.reduce((sum: number, day: any) => sum + (day.calories || 0), 0) / totalDays;
    const workoutDays = dailyData.filter((day: any) => day.did_workout).length;
    const greenDays = dailyData.filter((day: any) => {
      const score = 
        (day.calorie_ratio <= 1.0 ? 1 : 0) +
        (day.sleep_hours >= 6 ? 1 : 0) +
        (day.did_workout ? 1 : 0);
      return score === 3;
    }).length;

    // Generate summary
    let summary = `📊 **${range === 1 ? "Yesterday's" : `${range}-Day`} Summary**\n\n`;
    
    summary += `🛌 **Sleep**: ${avgSleep.toFixed(1)} hours average\n`;
    summary += `🍽️ **Nutrition**: ${Math.round(avgCalories)} calories average\n`;
    summary += `💪 **Workouts**: ${workoutDays} out of ${totalDays} days\n`;
    summary += `✅ **Perfect Days**: ${greenDays} green streak days\n\n`;

    // Add insights
    summary += `**Insights:**\n`;
    
    if (avgSleep < 6) {
      summary += `⚠️ Your sleep is below target. Aim for at least 6 hours per night.\n`;
    } else if (avgSleep >= 7) {
      summary += `✨ Great sleep! You're getting adequate rest.\n`;
    }

    const workoutRate = (workoutDays / totalDays) * 100;
    if (workoutRate < 50) {
      summary += `⚠️ Only ${workoutRate.toFixed(0)}% workout completion. Let's aim higher!\n`;
    } else if (workoutRate >= 80) {
      summary += `🔥 ${workoutRate.toFixed(0)}% workout completion - you're crushing it!\n`;
    }

    if (greenDays === 0) {
      summary += `💪 No perfect days yet. Let's work on hitting all three targets!\n`;
    } else {
      summary += `🌟 You had ${greenDays} perfect ${greenDays === 1 ? 'day' : 'days'}. Keep it up!\n`;
    }

    // Add recommendations
    summary += `\n**Recommendations:**\n`;
    
    if (avgSleep < 6) {
      summary += `• Set a consistent bedtime to improve sleep\n`;
    }
    
    if (workoutDays < totalDays * 0.7) {
      summary += `• Schedule workouts in advance to stay consistent\n`;
    }
    
    if (greenDays < totalDays * 0.5) {
      summary += `• Focus on small wins - aim for one perfect day this week\n`;
    } else {
      summary += `• You're doing great! Keep the momentum going\n`;
    }

    return summary;
  } catch (err) {
    console.error("Error in askMrPBJ:", err);
    return "Sorry, something went wrong. Please try again.";
  }
}
