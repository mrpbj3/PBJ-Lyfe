"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/DashboardCard";
import { ArrowLeft, User, Settings, Mail } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/auth/AuthProvider";
import { apiClient } from "@/lib/apiClient";

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => apiClient('/api/profile'),
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/today">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Today
            </Button>
          </Link>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Profile</h1>
        
        {/* User Info */}
        <DashboardCard title="Account" className="mb-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: profile?.profile_color || '#3B82F6' }}
              >
                {profile?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                {profile?.last_name?.[0]?.toUpperCase() || ''}
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {profile?.first_name && profile?.last_name 
                    ? `${profile.first_name} ${profile.last_name}`
                    : user?.email
                  }
                </h2>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* Quick Stats */}
        {profile && (
          <DashboardCard title="Goals Summary" className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Sleep Goal</p>
                <p className="text-lg font-semibold">
                  {profile.sleep_target_minutes 
                    ? `${Math.floor(profile.sleep_target_minutes / 60)}h ${profile.sleep_target_minutes % 60}m`
                    : 'Not set'
                  }
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Workout Goal</p>
                <p className="text-lg font-semibold">
                  {profile.workout_days_target 
                    ? `${profile.workout_days_target} days/week`
                    : 'Not set'
                  }
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Calorie Target</p>
                <p className="text-lg font-semibold">
                  {profile.calorie_target 
                    ? `${profile.calorie_target} cal`
                    : 'Not set'
                  }
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Target Weight</p>
                <p className="text-lg font-semibold">
                  {profile.target_weight 
                    ? `${profile.target_weight} ${profile.units_weight || 'lb'}`
                    : 'Not set'
                  }
                </p>
              </div>
            </div>
          </DashboardCard>
        )}

        {/* Actions */}
        <DashboardCard title="Settings">
          <div className="space-y-3">
            <Link href="/profile-detailed" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile & Goals
              </Button>
            </Link>
            
            <Link href="/contact" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </Link>
            
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
