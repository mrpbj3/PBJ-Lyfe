"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/auth/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { DashboardCard } from "@/components/DashboardCard";
import { StatusChip } from "@/components/StatusChip";
import { EmptyState } from "@/components/EmptyState";
import HeaderMenu from "@/components/HeaderMenu";
import { Button } from "@/components/ui/button";
import { DailyCheckInWizard } from "@/components/DailyCheckInWizard";
import { Sleep7d } from "@/components/charts/Sleep7d";
import { Weight7d } from "@/components/charts/Weight7d";
import { Nutrition7d } from "@/components/charts/Nutrition7d";
import { Workouts7dTable } from "@/components/Workouts7dTable";
import {
  Activity,
  Moon,
  Scale,
  Utensils,
  Brain,
  Briefcase,
  Heart,
  Home,
  Coffee,
  Wind,
  Sparkles
} from "lucide-react";

import { getTodayISO } from "@/lib/dateUtils";
import { apiClient } from "@/lib/apiClient";

interface DailyAnalytics {
  date: string;
  sleepHours: number;
  calories: number;
  workouts: number;
  weight: number | null;
  scoreSmall: number;
  kcalGoal: number;
}

export default function Today() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();
  const { profile } = useProfile();
  const today = getTodayISO();
  const [showWizard, setShowWizard] = useState(false);

  // Fetch today's analytics
  const { data: dailyAnalytics } = useQuery({
    queryKey: ["analytics", "daily", today],
    queryFn: () => apiClient(`/api/analytics/daily?date=${today}`),
    enabled: isAuthenticated,
  });

  // Fetch streak
  const { data: streakData } = useQuery({
    queryKey: ["streak", "current"],
    queryFn: () => apiClient("/api/streak/current"),
    enabled: isAuthenticated,
  });

  // DEBUG LOGS — (NOW IN THE RIGHT SPOT)
  console.log("=== TODAY PAGE MOUNTED ===");
  console.log("AUTH:", { user, isLoading, isAuthenticated });
  console.log("PROFILE:", profile);
  console.log("DAILY ANALYTICS:", dailyAnalytics);
  console.log("STREAK:", streakData);

  // Auto-show wizard
  useEffect(() => {
    if (isAuthenticated && dailyAnalytics) {
      const last = localStorage.getItem("lastCheckInDate");
      const done = localStorage.getItem("completedCheckIn_" + today);

      if (!done && dailyAnalytics.scoreSmall === 0 && last !== today) {
        setShowWizard(true);
      }
    }
  }, [isAuthenticated, dailyAnalytics, today]);
