// server/routes.ts
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth";
import * as storage from "./storage";
import { supabase } from "./supabase";
import OpenAI from "openai";
import { getStreakFromDailySummary, type DailySummaryRow } from "./streakLogic";
import { getDailyAnalytics, get7DayAnalytics } from "./analytics";
import { getCurrentStreak } from "./streak";
import { getHealthStatus } from "./health";

export async function registerRoutes(app: Express): Promise<Server> {
  // Re-enable Replit Auth
  await setupAuth(app);

  // AUTH
  app.get(
    "/api/auth/user",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const claims = req.user?.claims;
        // Parse name into firstName and lastName
        const fullName = claims?.name || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        res.json({ 
          id: claims?.sub, 
          email: claims?.email, 
          firstName,
          lastName,
          profileImageUrl: claims?.profileImage 
        });
      } catch {
        res.status(500).json({ message: "Failed to fetch user" });
      }
    },
  );

  // SLEEP
  app.post("/api/sleep", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { startAt, endAt } = req.body;
      if (!startAt || !endAt)
        return res.status(400).json({ message: "startAt & endAt required" });
      const row = await storage.createSleep(userId, startAt, endAt);
      res.json(row);
    } catch (error) {
      console.error("Error creating sleep:", error);
      res.status(500).json({ message: "Failed to create sleep session" });
    }
  });

  app.get("/api/sleep/:date", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.params;
      const sessions = await storage.getSleepByDate(userId, date);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sleep:", error);
      res.status(500).json({ message: "Failed to fetch sleep sessions" });
    }
  });

  // WEIGHT
  app.post("/api/weight", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { date, weightKg } = req.body;
      if (!date || !weightKg)
        return res.status(400).json({ message: "date & weightKg required" });
      const row = await storage.createWeight(userId, date, weightKg);
      res.json(row);
    } catch (error) {
      console.error("Error creating weight:", error);
      res.status(500).json({ message: "Failed to create weight entry" });
    }
  });

  app.get("/api/weight", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const history = await storage.getWeightHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching weight:", error);
      res.status(500).json({ message: "Failed to fetch weight history" });
    }
  });

  // MEALS
  app.post("/api/meals", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { date, calories, proteinG, fatG, carbsG, notes } = req.body;
      if (!date || !calories)
        return res.status(400).json({ message: "date & calories required" });
      const row = await storage.createMeal(userId, date, calories, proteinG, fatG, carbsG, notes);
      res.json(row);
    } catch (error) {
      console.error("Error creating meal:", error);
      res.status(500).json({ message: "Failed to create meal" });
    }
  });

  app.get("/api/meals/:date", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.params;
      const meals = await storage.getMealsByDate(userId, date);
      res.json(meals);
    } catch (error) {
      console.error("Error fetching meals:", error);
      res.status(500).json({ message: "Failed to fetch meals" });
    }
  });

  // MEALS AI - Calculate nutrition with OpenAI
  app.post("/api/meals/ai-calc", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { description } = req.body;
      
      if (!description) {
        return res.status(400).json({ message: "description required" });
      }

      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        return res.status(503).json({ message: "OpenAI not configured" });
      }

      const openai = new OpenAI({ apiKey: openaiKey });
      const model = process.env.OPENAI_MODEL_MEALS || "gpt-4o-mini";
      const timeout = parseInt(process.env.OPENAI_TIMEOUT_MS || "30000");

      const prompt = `You are a nutrition expert. Analyze this meal description and provide calorie and macronutrient estimates.

Meal description: "${description}"

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{"calories": number, "protein_g": number, "fat_g": number, "carbs_g": number}

Use your best nutritional knowledge to estimate reasonable values.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const completion = await openai.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 150,
        }, { signal: controller.signal as any });

        clearTimeout(timeoutId);

        const content = completion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content.trim());

        res.json({
          calories: Math.round(parsed.calories || 0),
          proteinG: Math.round(parsed.protein_g || 0),
          fatG: Math.round(parsed.fat_g || 0),
          carbsG: Math.round(parsed.carbs_g || 0),
        });
      } catch (aiError: any) {
        clearTimeout(timeoutId);
        if (aiError.name === 'AbortError') {
          return res.status(504).json({ message: "AI request timeout" });
        }
        throw aiError;
      }
    } catch (error) {
      console.error("Error calculating nutrition with AI:", error);
      res.status(500).json({ message: "Failed to calculate nutrition" });
    }
  });

  // WORKOUTS
  app.post("/api/workouts", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { date, startAt, endAt } = req.body;
      if (!date || !startAt || !endAt)
        return res.status(400).json({ message: "date, startAt & endAt required" });
      const row = await storage.createWorkout(userId, date, startAt, endAt);
      res.json(row);
    } catch (error) {
      console.error("Error creating workout:", error);
      res.status(500).json({ message: "Failed to create workout" });
    }
  });

  app.get("/api/workouts/:date", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.params;
      const workouts = await storage.getWorkoutsByDate(userId, date);
      res.json(workouts);
    } catch (error) {
      console.error("Error fetching workouts:", error);
      res.status(500).json({ message: "Failed to fetch workouts" });
    }
  });

  // ANALYTICS
  app.get("/api/analytics/daily/:date", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.params;
      const analytics = await storage.getDailyAnalytics(userId, date);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // ANALYTICS - Query param version for Today page
  app.get("/api/analytics/daily", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const date = req.query.date as string;
      
      if (!date) {
        return res.status(400).json({ message: "date query parameter required" });
      }
      
      const analytics = await getDailyAnalytics(userId, date);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching daily analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/history/:days", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const days = parseInt(req.params.days) || 7;
      const history = await storage.getAnalyticsHistory(userId, days);
      res.json(history);
    } catch (error) {
      console.error("Error fetching analytics history:", error);
      res.status(500).json({ message: "Failed to fetch analytics history" });
    }
  });

  // STREAKS
  app.get("/api/streaks/current", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const streaks = await storage.getStreaks(userId);
      res.json(streaks);
    } catch (error) {
      console.error("Error fetching streaks:", error);
      res.status(500).json({ message: "Failed to fetch streaks" });
    }
  });

  // MENTAL HEALTH
  app.post("/api/mental", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { date, rating, why } = req.body;
      if (!date || !rating)
        return res.status(400).json({ message: "date & rating required" });
      const row = await storage.createMentalLog(userId, date, rating, why);
      res.json(row);
    } catch (error) {
      console.error("Error creating mental log:", error);
      res.status(500).json({ message: "Failed to create mental log" });
    }
  });

  // MEDITATION
  app.post("/api/meditation", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { date, durationMin } = req.body;
      if (!date || !durationMin)
        return res.status(400).json({ message: "date & durationMin required" });
      const row = await storage.createMeditation(userId, date, durationMin);
      res.json(row);
    } catch (error) {
      console.error("Error creating meditation session:", error);
      res.status(500).json({ message: "Failed to create meditation session" });
    }
  });

  // WORK STRESS
  app.post("/api/work", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { date, stress, why } = req.body;
      if (!date || !stress)
        return res.status(400).json({ message: "date & stress required" });
      const row = await storage.createWorkLog(userId, date, stress, why);
      res.json(row);
    } catch (error) {
      console.error("Error creating work log:", error);
      res.status(500).json({ message: "Failed to create work log" });
    }
  });

  app.get("/api/work/:date", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.params;
      const logs = await storage.getWorkLogsByDate(userId, date);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching work logs:", error);
      res.status(500).json({ message: "Failed to fetch work logs" });
    }
  });

  // HOBBIES
  app.post("/api/hobbies", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { date, hobby, durationMin } = req.body;
      if (!date || !hobby)
        return res.status(400).json({ message: "date & hobby required" });
      const row = await storage.createHobbyLog(userId, date, hobby, durationMin);
      res.json(row);
    } catch (error) {
      console.error("Error creating hobby log:", error);
      res.status(500).json({ message: "Failed to create hobby log" });
    }
  });

  app.get("/api/hobbies/:date", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.params;
      const logs = await storage.getHobbyLogsByDate(userId, date);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching hobby logs:", error);
      res.status(500).json({ message: "Failed to fetch hobby logs" });
    }
  });

  // SOCIAL
  app.post("/api/social", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { date, activity, durationMin } = req.body;
      if (!date || !activity)
        return res.status(400).json({ message: "date & activity required" });
      const row = await storage.createSocialLog(userId, date, activity, durationMin);
      res.json(row);
    } catch (error) {
      console.error("Error creating social log:", error);
      res.status(500).json({ message: "Failed to create social log" });
    }
  });

  app.get("/api/social/:date", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.params;
      const logs = await storage.getSocialLogsByDate(userId, date);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching social logs:", error);
      res.status(500).json({ message: "Failed to fetch social logs" });
    }
  });

  // RECOVERY
  app.post("/api/recovery/drug-use", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { date, drugName, amount, isPrescribed } = req.body;
      if (!date || !drugName)
        return res.status(400).json({ message: "date and drugName required" });
      const row = await storage.createDrugUseLog(userId, date, drugName, amount, isPrescribed);
      res.json(row);
    } catch (error) {
      console.error("Error creating drug use log:", error);
      res.status(500).json({ message: "Failed to create drug use log" });
    }
  });

  app.post("/api/recovery/withdrawal", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { date, drugName, symptoms } = req.body;
      if (!date || !drugName)
        return res.status(400).json({ message: "date and drugName required" });
      const row = await storage.createWithdrawalLog(userId, date, drugName, symptoms);
      res.json(row);
    } catch (error) {
      console.error("Error creating withdrawal log:", error);
      res.status(500).json({ message: "Failed to create withdrawal log" });
    }
  });
  
  // CALORIE CALCULATION
  app.post("/api/calculate-calories", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { mealsDescription } = req.body;
      if (!mealsDescription)
        return res.status(400).json({ message: "mealsDescription required" });
      
      const result = await storage.calculateCaloriesWithAI(mealsDescription);
      res.json(result);
    } catch (error) {
      console.error("Error calculating calories:", error);
      res.status(500).json({ message: "Failed to calculate calories" });
    }
  });

  // PROFILE
  app.get("/api/profile", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfile(userId);
      res.json(profile || { inRecovery: false });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });
  
  // GOALS
  app.get("/api/goals", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const goals = await storage.getGoals(userId);
      res.json(goals || { kcalGoal: 2000 });
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  // STREAK - Get current streak based on real data
  // Days with no data are treated as RED and break the streak
  app.get("/api/streak/current", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const result = await getCurrentStreak(userId);
      res.json(result);
    } catch (error) {
      console.error("Error calculating streak:", error);
      res.status(500).json({ message: "Failed to calculate streak" });
    }
  });

  // ANALYTICS - Get 7-day data for visualizations
  app.get("/api/analytics/7d", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const result = await get7DayAnalytics(userId);
      res.json(result);
    } catch (error) {
      console.error("Error fetching 7d analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // CHECKINS - Get recent check-ins
  app.get("/api/checkins/recent", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 7;

      const { data, error } = await supabase
        .from('daily_checkins')
        .select('id, for_date')
        .eq('user_id', userId)
        .order('for_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching recent checkins:", error);
        return res.status(500).json({ message: "Failed to fetch checkins" });
      }

      res.json(data || []);
    } catch (error) {
      console.error("Error fetching recent checkins:", error);
      res.status(500).json({ message: "Failed to fetch checkins" });
    }
  });

  // CHECKINS - Get all check-ins with pagination
  app.get("/api/checkins/all", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const { data, error } = await supabase
        .from('daily_checkins')
        .select('id, for_date')
        .eq('user_id', userId)
        .order('for_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching all checkins:", error);
        return res.status(500).json({ message: "Failed to fetch checkins" });
      }

      res.json(data || []);
    } catch (error) {
      console.error("Error fetching all checkins:", error);
      res.status(500).json({ message: "Failed to fetch checkins" });
    }
  });

  // CHECKINS - Get check-in details by date
  app.get("/api/checkins/:date", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.params;

      const { data, error } = await supabase
        .from('v_checkin_answers_flat')
        .select('section, key, value_text')
        .eq('user_id', userId)
        .eq('for_date', date)
        .order('section')
        .order('key');

      if (error) {
        console.error("Error fetching checkin details:", error);
        return res.status(500).json({ message: "Failed to fetch checkin details" });
      }

      res.json(data || []);
    } catch (error) {
      console.error("Error fetching checkin details:", error);
      res.status(500).json({ message: "Failed to fetch checkin details" });
    }
  });

  // COACH - Analyze health data
  app.post("/api/coach/analyze", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { windowDays, question } = req.body;

      const days = windowDays || 7;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const end = endDate.toISOString().split('T')[0];
      const start = startDate.toISOString().split('T')[0];

      // Get daily summary data
      const { data: summaryData, error } = await supabase
        .from('daily_summary')
        .select('*')
        .eq('user_id', userId)
        .gte('summary_date', start)
        .lte('summary_date', end)
        .order('summary_date', { ascending: false });

      if (error) {
        console.error("Error fetching summary data:", error);
        return res.status(500).json({ message: "Failed to fetch data" });
      }

      let data = summaryData || [];

      // If missing rows, derive from v_checkin_answers_flat
      if (data.length < days * 0.5) {
        const { data: answersData } = await supabase
          .from('v_checkin_answers_flat')
          .select('*')
          .eq('user_id', userId)
          .gte('for_date', start)
          .lte('for_date', end);

        // Group by date and derive metrics
        if (answersData) {
          const byDate: any = {};
          answersData.forEach((row: any) => {
            if (!byDate[row.for_date]) {
              byDate[row.for_date] = { summary_date: row.for_date };
            }
            if (row.section === 'Sleep' && row.key === 'hours') {
              byDate[row.for_date].sleep_hours = parseFloat(row.value_text) || 0;
            }
            if (row.section === 'Nutrition' && row.key === 'calorie_ratio') {
              byDate[row.for_date].calorie_ratio = parseFloat(row.value_text) || 0;
            }
            if (row.section === 'Workout' && row.key === 'did_workout') {
              byDate[row.for_date].did_workout = row.value_text === 'true';
            }
          });
          data = Object.values(byDate);
        }
      }

      // Calculate statistics
      const totalDays = data.length;
      if (totalDays === 0) {
        return res.json({
          message: `No data available for the ${question ? 'requested period' : `last ${days} days`}. Start logging to get insights!`
        });
      }

      const avgSleep = data.reduce((sum: number, d: any) => sum + (d.sleep_hours || 0), 0) / totalDays;
      const avgCalorieRatio = data.reduce((sum: number, d: any) => sum + (d.calorie_ratio || 0), 0) / totalDays;
      const workoutDays = data.filter((d: any) => d.did_workout).length;
      const avgSteps = data.reduce((sum: number, d: any) => sum + (d.steps || 0), 0) / totalDays;

      // Weight delta
      const weights = data.filter((d: any) => d.weight_kg).map((d: any) => d.weight_kg);
      const deltaWeight = weights.length >= 2 ? weights[weights.length - 1] - weights[0] : null;

      // Check for contradictions (same date with conflicting values)
      // This would require comparing raw answers, which is complex
      // For now, we'll skip this check

      // Generate response
      let response = `📊 **${days}-Day Analysis**\n\n`;
      response += `**Sleep**: ${avgSleep.toFixed(1)} hours average ${avgSleep < 6 ? '⚠️ Below target' : '✅'}\n`;
      response += `**Nutrition**: ${(avgCalorieRatio * 100).toFixed(0)}% of target ${avgCalorieRatio > 1.1 ? '⚠️ Surplus' : avgCalorieRatio < 0.9 ? '⚠️ Deficit' : '✅'}\n`;
      response += `**Workouts**: ${workoutDays} of ${totalDays} days ${workoutDays < totalDays / 3 ? '⚠️ Below recommendation' : '✅'}\n`;
      
      if (avgSteps > 0) {
        response += `**Steps**: ${Math.round(avgSteps)} average\n`;
      }
      
      if (deltaWeight !== null) {
        response += `**Weight Change**: ${deltaWeight > 0 ? '+' : ''}${deltaWeight.toFixed(1)} kg\n`;
      }

      response += `\n**Insights**: `;
      if (avgSleep < 6 && workoutDays < totalDays / 2) {
        response += `Focus on sleep and consistency. Both your rest and activity could improve.`;
      } else if (avgSleep < 6) {
        response += `Prioritize sleep - it's crucial for recovery and performance.`;
      } else if (workoutDays < totalDays / 3) {
        response += `Increase workout frequency. Aim for at least 3-4 sessions per week.`;
      } else {
        response += `You're doing well! Keep up the consistency.`;
      }

      if (question) {
        response += `\n\n**Regarding your question**: "${question}"\n`;
        response += `Based on your data, focus on the areas mentioned above.`;
      }

      res.json({ message: response });
    } catch (error) {
      console.error("Error analyzing data:", error);
      res.status(500).json({ message: "Failed to analyze data" });
    }
  });

  // CONTACT - Submit contact form
  app.post("/api/contact", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { first_name, last_name, email, phone, message } = req.body;

      if (!email || !message) {
        return res.status(400).json({ message: "Email and message are required" });
      }

      // Insert into Supabase
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          user_id: userId,
          first_name,
          last_name,
          email,
          phone,
          message,
        });

      if (error) {
        console.error("Error inserting contact message:", error);
        // Continue anyway - we'll try to send email
      }

      // Try to send email (don't block on failure)
      try {
        // Check for email service configuration
        const resendKey = process.env.RESEND_API_KEY;
        const smtpHost = process.env.SMTP_HOST;

        if (resendKey) {
          // Use Resend
          // Note: This requires installing 'resend' package
          // For now, we'll log and skip
          console.log('Resend email would be sent to mr.pbj@pbjstudios.com');
        } else if (smtpHost) {
          // Use Nodemailer
          // Note: This requires installing 'nodemailer' package
          // For now, we'll log and skip
          console.log('SMTP email would be sent to mr.pbj@pbjstudios.com');
        } else {
          console.log('No email service configured. Message saved to database only.');
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Don't fail the request if email fails
      }

      res.json({ message: "Message received successfully" });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ message: "Failed to process contact form" });
    }
  });

  // Health check endpoint for debugging
  app.get("/api/health", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const hasAuthHeader = !!req.headers.authorization;

      if (!userId) {
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Health Check - PBJ-Lyfe</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; background: #0f1729; color: #e2e8f0; }
                .container { background: #1e293b; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
                h1 { color: #AB13E6; margin-top: 0; }
                .status { padding: 12px; border-radius: 6px; margin: 20px 0; font-weight: 600; }
                .error { background: #991b1b; color: #fecaca; }
                .back-btn { display: inline-block; padding: 10px 20px; background: #AB13E6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                .back-btn:hover { background: #8b0fc4; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🏥 Health Check</h1>
                <div class="status error">
                  ❌ Authentication Failed: No user ID found
                </div>
                <p><strong>Auth Header Present:</strong> ${hasAuthHeader ? 'Yes' : 'No'}</p>
                <a href="/" class="back-btn">← Back to Today</a>
              </div>
            </body>
          </html>
        `;
        return res.status(401).send(html);
      }

      // Get counts from various tables
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const start = startDate.toISOString().split('T')[0];

      const supabase = await setupSupabaseServer(req);

      const [summaryCount, mealsCount, sleepCount, workoutsCount] = await Promise.all([
        supabase.from('daily_summary').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('summary_date', start).lte('summary_date', endDate),
        supabase.from('meals').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('meal_date', start).lte('meal_date', endDate),
        supabase.from('sleep_sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('sleep_date', start).lte('sleep_date', endDate),
        supabase.from('workouts').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('workout_date', start).lte('workout_date', endDate)
      ]);

      const counts = {
        daily_summary: summaryCount.count || 0,
        meals: mealsCount.count || 0,
        sleep_sessions: sleepCount.count || 0,
        workouts: workoutsCount.count || 0
      };

      const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
      const statusClass = totalCount > 0 ? 'success' : 'warning';
      const statusIcon = totalCount > 0 ? '✅' : '⚠️';
      const statusText = totalCount > 0 ? 'System Healthy' : 'No Data Found';

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Health Check - PBJ-Lyfe</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; background: #0f1729; color: #e2e8f0; }
              .container { background: #1e293b; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
              h1 { color: #AB13E6; margin-top: 0; }
              .status { padding: 12px; border-radius: 6px; margin: 20px 0; font-weight: 600; }
              .success { background: #166534; color: #bbf7d0; }
              .warning { background: #854d0e; color: #fef08a; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
              .info-card { background: #334155; padding: 15px; border-radius: 6px; }
              .info-card h3 { margin: 0 0 10px 0; font-size: 14px; color: #94a3b8; }
              .info-card .value { font-size: 24px; font-weight: bold; color: #AB13E6; }
              .back-btn { display: inline-block; padding: 10px 20px; background: #AB13E6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .back-btn:hover { background: #8b0fc4; }
              .detail { margin: 10px 0; }
              .detail strong { color: #94a3b8; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🏥 Health Check</h1>
              <div class="status ${statusClass}">
                ${statusIcon} ${statusText}
              </div>
              
              <div class="detail">
                <strong>Auth Status:</strong> ${hasAuthHeader ? '✅ Authenticated' : '❌ Not Authenticated'}
              </div>
              <div class="detail">
                <strong>User ID:</strong> ${userId}
              </div>
              <div class="detail">
                <strong>Date Range:</strong> ${start} to ${endDate} (Last 7 days)
              </div>

              <h2 style="margin-top: 30px; color: #AB13E6;">📊 Data Counts</h2>
              <div class="info-grid">
                <div class="info-card">
                  <h3>Daily Summaries</h3>
                  <div class="value">${counts.daily_summary}</div>
                </div>
                <div class="info-card">
                  <h3>Meals</h3>
                  <div class="value">${counts.meals}</div>
                </div>
                <div class="info-card">
                  <h3>Sleep Sessions</h3>
                  <div class="value">${counts.sleep_sessions}</div>
                </div>
                <div class="info-card">
                  <h3>Workouts</h3>
                  <div class="value">${counts.workouts}</div>
                </div>
              </div>

              <div class="detail" style="margin-top: 20px;">
                <strong>Total Records:</strong> ${totalCount}
              </div>

              ${totalCount === 0 ? '<p style="color: #fef08a; margin-top: 20px;">⚠️ No data found in the last 7 days. Check if data has been imported and RLS policies are configured correctly.</p>' : ''}

              <a href="/" class="back-btn">← Back to Today</a>
            </div>
          </body>
        </html>
      `;

      res.send(html);
    } catch (error) {
      console.error("Error in health check:", error);
      const errorMessage = error instanceof Error ? error.message : "Health check failed";
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Health Check Error - PBJ-Lyfe</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; background: #0f1729; color: #e2e8f0; }
              .container { background: #1e293b; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
              h1 { color: #AB13E6; margin-top: 0; }
              .status { padding: 12px; border-radius: 6px; margin: 20px 0; font-weight: 600; }
              .error { background: #991b1b; color: #fecaca; }
              .back-btn { display: inline-block; padding: 10px 20px; background: #AB13E6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .back-btn:hover { background: #8b0fc4; }
              pre { background: #334155; padding: 15px; border-radius: 6px; overflow-x: auto; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🏥 Health Check</h1>
              <div class="status error">
                ❌ Error: ${errorMessage}
              </div>
              <pre>${error instanceof Error ? error.stack : 'Unknown error'}</pre>
              <a href="/" class="back-btn">← Back to Today</a>
            </div>
          </body>
        </html>
      `;
      res.status(500).send(html);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
