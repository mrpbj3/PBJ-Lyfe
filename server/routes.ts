// server/routes.ts
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth";
import * as storage from "./storage";

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
  
  // PROFILE DETAILED
  app.get("/api/profile-detailed", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfileDetailed(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile detailed:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile-detailed", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const result = await storage.updateProfileDetailed(userId, req.body);
      res.json(result);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // CHECK-INS
  app.get("/api/check-ins", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const checkIns = await storage.getCheckIns(userId, limit);
      res.json(checkIns);
    } catch (error) {
      console.error("Error fetching check-ins:", error);
      res.status(500).json({ message: "Failed to fetch check-ins" });
    }
  });

  app.post("/api/check-ins", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { date, weight, notes } = req.body;
      if (!date || !weight) {
        return res.status(400).json({ message: "date and weight required" });
      }
      const checkIn = await storage.createCheckIn(userId, date, weight, notes);
      res.json(checkIn);
    } catch (error) {
      console.error("Error creating check-in:", error);
      res.status(500).json({ message: "Failed to create check-in" });
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

  const httpServer = createServer(app);
  return httpServer;
}
