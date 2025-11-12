// server/routes.ts
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth";
import * as storage from "./storage";
import { supabase } from "./supabase";

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
  app.get("/api/streak/current", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const today = new Date().toISOString().split('T')[0];
      
      // Try to get data from daily_summary
      const { data: summaryData, error } = await supabase
        .from('daily_summary')
        .select('summary_date, streak_color, calorie_ratio, sleep_hours, did_workout')
        .eq('user_id', userId)
        .lte('summary_date', today)
        .order('summary_date', { ascending: false })
        .limit(60);

      if (error) {
        console.error("Error fetching streak data:", error);
        return res.status(500).json({ message: "Failed to fetch streak data" });
      }

      let daysData: any[] = summaryData || [];
      
      // If we have less than 3 rows, try to derive from v_checkin_answers_flat
      if (daysData.length < 3) {
        const { data: answersData, error: answersError } = await supabase
          .from('v_checkin_answers_flat')
          .select('for_date, section, key, value_text')
          .eq('user_id', userId)
          .lte('for_date', today)
          .order('for_date', { ascending: false })
          .limit(180); // 60 days * ~3 answers per day

        if (!answersError && answersData) {
          // Group by date
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
              byDate[row.for_date].did_workout = row.value_text === 'true' || row.value_text === '1';
            }
          });
          daysData = Object.values(byDate);
        }
      }

      // Calculate streak color for each day if not present
      daysData = daysData.map((day: any) => {
        if (!day.streak_color) {
          const score =
            (day.calorie_ratio !== null && day.calorie_ratio <= 1.0 ? 1 : 0) +
            (day.sleep_hours !== null && day.sleep_hours >= 6 ? 1 : 0) +
            (day.did_workout ? 1 : 0);
          day.streak_color = score === 3 ? 'green' : score === 2 ? 'yellow' : 'red';
        }
        return day;
      });

      // Calculate run-length from most recent backward
      let count = 0;
      let color: 'green' | 'yellow' | 'red' = 'red';
      let overall = 0;

      for (const day of daysData) {
        if (day.streak_color === 'red') {
          break;
        }
        count++;
        overall++;
        color = day.streak_color;
      }

      res.json({ count, color, overall });
    } catch (error) {
      console.error("Error calculating streak:", error);
      res.status(500).json({ message: "Failed to calculate streak" });
    }
  });

  // ANALYTICS - Get 7-day data for visualizations
  app.get("/api/analytics/7d", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);

      const end = endDate.toISOString().split('T')[0];
      const start = startDate.toISOString().split('T')[0];

      // Get profile for calorie target
      const { data: profile } = await supabase
        .from('profiles')
        .select('calorie_target, sleep_target_minutes')
        .eq('user_id', userId)
        .single();

      const kcalTarget = profile?.calorie_target || 2000;
      const sleepTarget = (profile?.sleep_target_minutes || 360) / 60;

      // Initialize result array with all dates
      const result: any[] = [];
      for (let d = new Date(start); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          sleepHours: null,
          weightKg: null,
          workoutMin: 0,
          calories: 0,
          kcalTarget,
          sleepTarget
        });
      }

      // Get sleep data
      const { data: sleepData } = await supabase
        .from('sleep_sessions')
        .select('start_at, end_at, duration_min')
        .eq('user_id', userId)
        .gte('start_at', start)
        .lte('start_at', end);

      if (sleepData) {
        sleepData.forEach((session: any) => {
          const sleepDate = session.start_at.split('T')[0];
          const dayData = result.find(d => d.date === sleepDate);
          if (dayData) {
            dayData.sleepHours = (dayData.sleepHours || 0) + (session.duration_min / 60);
          }
        });
      }

      // Get weight data
      const { data: weightData } = await supabase
        .from('body_metrics')
        .select('date, weight_kg')
        .eq('user_id', userId)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true });

      if (weightData) {
        weightData.forEach((metric: any) => {
          const dayData = result.find(d => d.date === metric.date);
          if (dayData) {
            dayData.weightKg = metric.weight_kg;
          }
        });
      }

      // Get workout data
      const { data: workoutData } = await supabase
        .from('workouts')
        .select('date, duration_min')
        .eq('user_id', userId)
        .gte('date', start)
        .lte('date', end);

      if (workoutData) {
        workoutData.forEach((workout: any) => {
          const dayData = result.find(d => d.date === workout.date);
          if (dayData) {
            dayData.workoutMin += workout.duration_min || 0;
          }
        });
      }

      // Get nutrition data
      const { data: mealsData } = await supabase
        .from('meals')
        .select('date, calories')
        .eq('user_id', userId)
        .gte('date', start)
        .lte('date', end);

      if (mealsData) {
        mealsData.forEach((meal: any) => {
          const dayData = result.find(d => d.date === meal.date);
          if (dayData) {
            dayData.calories += meal.calories || 0;
          }
        });
      }

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

  const httpServer = createServer(app);
  return httpServer;
}
