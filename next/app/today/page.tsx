"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Activity, Sparkles } from "lucide-react";

interface DailyAnalytics {
  date: string;
  sleepHours: number;
  calories: number;
  workouts: number;
  weight: number | null;
  scoreSmall: number;
  kcalGoal: number;
}

export default function TodayPage() {
  const today = new Date().toISOString().split("T")[0];

  // Fetch today's analytics
  const { data: dailyAnalytics, isLoading: analyticsLoading } =
    useQuery<DailyAnalytics>({
      queryKey: ["analytics", "daily", today],
      queryFn: async () => {
        const res = await fetch(`/api/analytics/daily?date=${today}`);
        if (!res.ok) throw new Error("Failed to fetch analytics");
        return res.json();
      },
    });

  // Fetch current streak
  const { data: streakData, isLoading: streakLoading } = useQuery({
    queryKey: ["streak", "current"],
    queryFn: async () => {
      const res = await fetch("/api/streak/current");
      if (!res.ok) throw new Error("Failed to fetch streak");
      return res.json();
    },
  });

  const streakCount = streakData?.count || 0;
  const streakColor = streakData?.color || "red";
  const overall = streakData?.overall || 0;

  if (analyticsLoading || streakLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">PBJ Lyfe</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Welcome Message */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">
            Today: {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Streak Overview */}
        <div className="mb-8 p-8 rounded-xl border bg-card">
          <div className="text-center">
            {streakColor === "green" && streakCount > 0 ? (
              <>
                <p className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {streakCount} {streakCount === 1 ? "Day" : "Days"}
                </p>
                <p className="text-xl font-semibold uppercase tracking-wide text-green-600 dark:text-green-400 mb-2">
                  GREEN STREAK
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  GOOD JOB! Congrats on another great day. Let's keep the streak
                  going!
                </p>
                {overall > streakCount && (
                  <p className="text-base font-semibold text-yellow-600 dark:text-yellow-400">
                    Overall Streak {overall} {overall === 1 ? "Day" : "Days"}
                  </p>
                )}
              </>
            ) : streakColor === "yellow" && streakCount > 0 ? (
              <>
                <p className="text-5xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                  {streakCount} {streakCount === 1 ? "Day" : "Days"}
                </p>
                <p className="text-xl font-semibold uppercase tracking-wide text-yellow-600 dark:text-yellow-400 mb-2">
                  STREAK LENGTH
                </p>
                <p className="text-sm text-muted-foreground">
                  GOOD JOB KEEPING THE STREAK ALIVE! LET'S AIM FOR A GREAT DAY
                  TOMORROW.
                </p>
              </>
            ) : (
              <>
                <p className="text-5xl font-bold text-red-600 dark:text-red-400 mb-2">
                  {streakCount > 0 ? streakCount : 0}{" "}
                  {streakCount === 1 ? "Day" : "Days"}
                </p>
                <p className="text-xl font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 mb-2">
                  {streakCount > 0 ? "RED STREAK LENGTH" : "NO ACTIVE STREAK"}
                </p>
                <p className="text-sm text-muted-foreground">
                  You said "better." Time to mean it.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Daily Stats */}
        {dailyAnalytics && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-lg font-semibold mb-2">Sleep</h3>
              <p className="text-3xl font-bold">
                {dailyAnalytics.sleepHours} hrs
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-lg font-semibold mb-2">Calories</h3>
              <p className="text-3xl font-bold">{dailyAnalytics.calories}</p>
              <p className="text-sm text-muted-foreground">
                Goal: {dailyAnalytics.kcalGoal}
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-lg font-semibold mb-2">Workouts</h3>
              <p className="text-3xl font-bold">{dailyAnalytics.workouts}</p>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/sleep"
            className="p-6 rounded-lg border bg-card hover:bg-accent transition"
          >
            <h3 className="text-lg font-semibold">Sleep</h3>
            <p className="text-sm text-muted-foreground">Track sleep</p>
          </Link>
          <Link
            href="/weight"
            className="p-6 rounded-lg border bg-card hover:bg-accent transition"
          >
            <h3 className="text-lg font-semibold">Weight</h3>
            <p className="text-sm text-muted-foreground">Log weight</p>
          </Link>
          <Link
            href="/nutrition"
            className="p-6 rounded-lg border bg-card hover:bg-accent transition"
          >
            <h3 className="text-lg font-semibold">Nutrition</h3>
            <p className="text-sm text-muted-foreground">Track meals</p>
          </Link>
          <Link
            href="/workouts"
            className="p-6 rounded-lg border bg-card hover:bg-accent transition"
          >
            <h3 className="text-lg font-semibold">Workouts</h3>
            <p className="text-sm text-muted-foreground">Log exercises</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
