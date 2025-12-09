"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/auth/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
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
  Dumbbell,
} from "lucide-react";

import { apiClient } from "@/lib/apiClient";
import { getTodayISO } from "@/lib/dateUtils";

// ----------------------
// Types (Final Formats)
// ----------------------
interface DailyAnalyticsRes {
  date: string;
  sleepHours: number;
  calories: number;
  workouts: number;
  weight: number | null;
  kcalGoal: number;
  steps?: number | null;
  streakColor: "green" | "yellow" | "red";
}

interface StreakRes {
  count: number; // 0 when red
  color: "green" | "yellow" | "red";
  lastDate: string; // ISO date
}

// ----------------------
// Component
// ----------------------
export default function Today() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();
  const { profile } = useProfile();
  const today = getTodayISO();

  const [showWizard, setShowWizard] = useState(false);

  // ----------------------
  // 🔥 Debug Logging
  // ----------------------
  console.log("=== TODAY PAGE MOUNTED ===");
  console.log("AUTH:", { user, isLoading, isAuthenticated });
  console.log("PROFILE:", profile);

  // ----------------------
  // Fetch Daily Analytics
  // ----------------------
  const {
    data: daily,
    isLoading: loadingDaily,
    error: dailyError,
  } = useQuery<DailyAnalyticsRes>({
    queryKey: ["analytics-daily", today],
    queryFn: () => apiClient(`/api/analytics/daily?date=${today}`),
    enabled: isAuthenticated,
  });

  // ----------------------
  // Fetch Streak
  // ----------------------
  const {
    data: streak,
    isLoading: loadingStreak,
    error: streakError,
  } = useQuery<StreakRes>({
    queryKey: ["streak-current"],
    queryFn: () => apiClient(`/api/streak/current`),
    enabled: isAuthenticated,
  });

  console.log("DAILY:", daily);
  console.log("STREAK:", streak);
  console.log("DAILY ERROR:", dailyError);
  console.log("STREAK ERROR:", streakError);

  // ----------------------
  // Loading State
  // ----------------------
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // ----------------------
  // Streak Mapping
  // ----------------------
  const streakCount = streak?.color === "red" ? 0 : streak?.count ?? 0;
  const streakColor: "green" | "yellow" | "red" =
    streak?.color ?? "red";

  // ----------------------
  // Show Wizard Only on Tap
  // ----------------------
  const openWizard = () => setShowWizard(true);
  const closeWizard = () => setShowWizard(false);

  // ----------------------
  // UI
  // ----------------------
  return (
    <div className="min-h-screen bg-background">
      {/* Check-In Wizard */}
      <DailyCheckInWizard
        isOpen={showWizard}
        onClose={closeWizard}
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
              onClick={openWizard}
              data-testid="button-open-checkin"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Daily Check-In
            </Button>
            <HeaderMenu />
          </div>
        </div>
      </header>

      {/* Welcome */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.first_name}!
          </h2>
          <p className="text-muted-foreground">
            Today Date:{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Quick Access */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-center mb-6">
            How's Lyfe?
          </h3>

          <div className="grid grid-cols-5 md:grid-cols-11 gap-3">
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
            <LifeButton icon={Dumbbell} label="Workouts" href="/workouts" />
          </div>
        </div>

        {/* Streak UI */}
        <div className="mb-8 p-8 rounded-xl border bg-card text-center">
          {streakColor === "green" ? (
            <>
              <p className="text-5xl font-bold text-green-600 mb-2">
                {streakCount} {streakCount === 1 ? "Day" : "Days"}
              </p>
              <p className="text-xl font-semibold uppercase tracking-wide text-green-600 mb-2">
                GREEN STREAK
              </p>
              <p className="text-sm text-muted-foreground">
                Good job! Keep the momentum.
              </p>
            </>
          ) : streakColor === "yellow" ? (
            <>
              <p className="text-5xl font-bold text-yellow-500 mb-2">
                {streakCount} Days
              </p>
              <p className="text-xl font-semibold uppercase tracking-wide text-yellow-500 mb-2">
                YELLOW STREAK
              </p>
              <p className="text-sm text-muted-foreground">
                Solid progress. Aim green tomorrow.
              </p>
            </>
          ) : (
            <>
              <p className="text-5xl font-bold text-red-500 mb-2">0 Days</p>
              <p className="text-xl font-semibold uppercase tracking-wide text-red-500 mb-2">
                NO ACTIVE STREAK
              </p>
              <p className="text-sm text-muted-foreground">
                You said “better.” Time to mean it.
              </p>
            </>
          )}
        </div>

        {/* Main Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <DashboardCard title="Sleep" description="7-day sleep trend">
            <Sleep7d userId={user!.id} />
          </DashboardCard>

          <DashboardCard title="Weight" description="7-day weight trend">
            <Weight7d userId={user!.id} />
          </DashboardCard>

          <DashboardCard title="Nutrition" description="7-day calorie trend">
            <Nutrition7d userId={user!.id} />
          </DashboardCard>

          <DashboardCard title="Workouts" description="7-day workout history">
            <Workouts7dTable userId={user!.id} />
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}

// ----------------------
// LifeButton Component
// ----------------------
function LifeButton({
  icon: Icon,
  label,
  href,
}: {
  icon: any;
  label: string;
  href: string;
}) {
  return (
    <Link href={href} data-testid={`link-${label.toLowerCase()}`}>
      <Button variant="outline" className="w-full h-16 flex-col gap-1 hover-elevate">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </Button>
    </Link>
  );
}
