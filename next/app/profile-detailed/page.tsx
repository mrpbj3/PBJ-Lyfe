"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ProfileDetailedPage() {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  const { data: checkins, isLoading: checkinsLoading } = useQuery({
    queryKey: ["checkins", "recent"],
    queryFn: async () => {
      const res = await fetch("/api/checkins/recent");
      if (!res.ok) throw new Error("Failed to fetch checkins");
      return res.json();
    },
  });

  if (profileLoading || checkinsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/today"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Today
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold mb-8">Detailed Profile</h1>

        {/* Profile Information */}
        <div className="p-6 rounded-lg border bg-card">
          <h2 className="text-2xl font-semibold mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="text-lg">
                {profile?.first_name} {profile?.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Calorie Target</p>
              <p className="text-lg">{profile?.calorie_target || 2000} kcal</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sleep Goal</p>
              <p className="text-lg">
                {Math.floor((profile?.sleep_target_minutes || 480) / 60)} hours
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Workout Goal</p>
              <p className="text-lg">
                {profile?.workout_days_target || 3} days/week
              </p>
            </div>
          </div>
        </div>

        {/* Recent Check-Ins */}
        <div className="p-6 rounded-lg border bg-card">
          <h2 className="text-2xl font-semibold mb-4">Recent Check-Ins</h2>
          {checkins && checkins.length > 0 ? (
            <div className="space-y-2">
              {checkins.map((checkin: any) => (
                <div
                  key={checkin.id}
                  className="p-3 rounded border hover:bg-accent cursor-pointer"
                >
                  <p className="font-medium">
                    {new Date(checkin.for_date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No check-ins found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
