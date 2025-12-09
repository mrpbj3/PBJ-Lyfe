"use client";

import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Dumbbell, Clock, FileText } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useParams } from 'next/navigation';
import { formatDate } from '@/lib/dateUtils';

export default function WorkoutDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const date = params.date as string;

  const { data: workout, isLoading } = useQuery({
    queryKey: ['workout', date, user?.id],
    queryFn: () => apiClient(`/api/workouts/${date}`),
    enabled: !!user && !!date,
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/workouts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workouts
            </Button>
          </Link>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Workout Details</h1>
        <p className="text-muted-foreground mb-8">{formatDate(date)}</p>
        
        {workout ? (
          <>
            <DashboardCard title="Summary" className="mb-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="text-lg font-semibold">
                      {workout.durationMin || workout.workout_minutes || 0} minutes
                    </p>
                  </div>
                </div>
                
                {(workout.startAt || workout.start_time) && (
                  <div className="flex items-center gap-3">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="text-lg font-semibold">
                        {workout.startAt || workout.start_time} - {workout.endAt || workout.end_time}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </DashboardCard>

            {(workout.exercises || workout.workout_note) && (
              <DashboardCard title="Exercises" className="mb-6">
                {workout.exercises && Array.isArray(workout.exercises) ? (
                  <ul className="space-y-2">
                    {workout.exercises.map((exercise: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Dumbbell className="h-4 w-4 text-muted-foreground" />
                        <span>{exercise}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>{workout.workout_note}</p>
                )}
              </DashboardCard>
            )}

            {workout.notes && (
              <DashboardCard title="Notes">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <p>{workout.notes}</p>
                </div>
              </DashboardCard>
            )}
          </>
        ) : (
          <DashboardCard title="No Workout">
            <p className="text-muted-foreground">
              No workout was recorded for this date.
            </p>
            <Link href="/workouts">
              <Button className="mt-4">
                Log a Workout
              </Button>
            </Link>
          </DashboardCard>
        )}
      </div>
    </div>
  );
}
