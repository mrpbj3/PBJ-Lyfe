// PBJ Health - Today Dashboard
// Main daily tracking screen with all health cards
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/auth/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { DashboardCard } from "@/components/DashboardCard";
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
  Sparkles,
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
  const { user, loading: isLoading, isAuthenticated, signOut } = useAuth();
  const { profile } = useProfile();
  const today = getTodayISO();
  const [showWizard, setShowWizard] = useState(false);

  // Fetch today's analytics
  const { data: dailyAnalytics } = useQuery<DailyAnalytics>({
    queryKey: ["analytics", "daily", today],
    queryFn: () => apiClient(`/api/analytics/daily?date=${today}`),
    enabled: isAuthenticated,
  });

  // Fetch streak data
  const { data: streakData } = useQuery({
    queryKey: ["streak", "current"],
    queryFn: () => apiClient("/api/streak/current"),
    enabled: isAuthenticated,
  });

  // --------------------------
  // SAFE LOGGING (after queries exist)
  // --------------------------
  useEffect(() => {
    console.log("=== TODAY PAGE MOUNTED ===");
    console.log("AUTH:", { isLoading, isAuthenticated, user });
    console.log("PROFILE:", profile);
    console.log("DAILY ANALYTICS:", dailyAnalytics);
    console.log("STREAK:", streakData);
  }, [isLoading, isAuthenticated, user, profile, dailyAnalytics, streakData]);

  // Auto open the daily check-in wizard
  useEffect(() => {
    if (isAuthenticated && dailyAnalytics) {
      const lastCheckInDate = localStorage.getItem("lastCheckInDate");
      const hasCompletedToday = localStorage.getItem(
        "completedCheckIn_" + today
      );

      if (
        !hasCompletedToday &&
        dailyAnalytics.scoreSmall === 0 &&
        lastCheckInDate !== today
      ) {
        setShowWizard(true);
      }
    }
  }, [isAuthenticated, dailyAnalytics, today]);

  const handleWizardClose = () => {
    setShowWizard(false);
    localStorage.setItem("completedCheckIn_" + today, "true");
    localStorage.setItem("lastCheckInDate", today);
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Streak mapping
  const streakCount = streakData?.count || 0;
  const streakColor = streakData?.color || "red";
  const overall = streakData?.overall || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Daily Check-In Wizard */}
      <DailyCheckInWizard
        isOpen={showWizard}
        onClose={handleWizardClose}
        userId={user?.id || ""}
        userFirstName={profile?.first_name ?? undefined}
      />

      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">PBJ Lyfe</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowWizard(true)}
              data-testid="button-open-checkin"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Daily Check-In
            </Button>
            <HeaderMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold">
            Welcome back, {profile?.first_name || "there"}!
          </h2>
          <p className="text-muted-foreground">
            Today:{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Quick Buttons */}
        <div className="mb-10">
          <h3 className="text-2xl font-semibold text-center mb-6">
            How's Lyfe?
          </h3>

          <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
            <LifeButton icon={Moon} label="Sleep" href="/sleep" />
            <LifeButton icon={Scale} label="Weight" href="/weight" />
            <LifeButton icon={Utensils} label="Nutrition" href="/nutrition" />
            <LifeButton icon={Brain} label="Mental" href="/mental" />
            <LifeButton icon={Moon} label="Dreams" href="/dreams" />
            <LifeButton icon={Briefcase} label="Work" href="/work" />
            <LifeButton icon={Wind} label="Meditation" href="/meditation" />
            <LifeButton icon={Heart} label="Social" href="/social" />
            <LifeButton icon={Home} label="Hobbies" href="/hobbies" />
            <LifeButton icon={Coffee} label="Recovery" href="/recovery" />
          </div>
        </div>

        {/* Streak Overview */}
        <div className="mb-8 p-8 rounded-xl border bg-card text-center">
          {streakColor === "green" && streakCount > 0 ? (
            <>
              <p className="text-5xl font-bold text-green-600 mb-2">
                {streakCount} Days
              </p>
              <p className="text-xl font-semibold">GREEN STREAK</p>
            </>
          ) : streakColor === "yellow" ? (
            <>
              <p className="text-5xl font-bold text-yellow-600 mb-2">
                {streakCount} Days
              </p>
              <p className="text-xl font-semibold">ON TRACK</p>
            </>
          ) : (
            <>
              <p className="text-5xl font-bold text-red-600 mb-2">0 Days</p>
              <p className="text-xl font-semibold">NO ACTIVE STREAK</p>
            </>
          )}
        </div>

        {/* Dashboard Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <DashboardCard title="Sleep" description="7-day sleep trend">
            <Sleep7d userId={user?.id || ""} />
          </DashboardCard>

          <DashboardCard title="Weight" description="7-day weight trend">
            <Weight7d userId={user?.id || ""} />
          </DashboardCard>

          <DashboardCard title="Nutrition" description="7-day calorie trend">
            <Nutrition7d userId={user?.id || ""} />
          </DashboardCard>

          <DashboardCard
            title="Workouts"
            description="7-day workout history"
          >
            <Workouts7dTable userId={user?.id || ""} />
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}

function LifeButton({ icon: Icon, label, href }: { icon: any; label: string; href: string }) {
  return (
    <Link href={href}>
      <Button variant="outline" className="w-full h-16 flex-col gap-1 hover-elevate">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </Button>
    </Link>
  );
}
