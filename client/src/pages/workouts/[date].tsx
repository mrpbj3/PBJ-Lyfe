// PBJ Health - Workout Detail Page
// Shows details for a specific workout day
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Dumbbell, Clock, Calendar } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface WorkoutDetails {
  summary_date: string;
  workout_minutes: number;
  workout_breakdown?: any;
  workout_type?: string;
  workout_name?: string;
}

export default function WorkoutDetail() {
  const { isAuthenticated } = useAuth();
  const params = useParams<{ date: string }>();
  const date = params.date;

  const { data: workoutData, isLoading } = useQuery<WorkoutDetails>({
    queryKey: ['/api/daily-summary', date],
    queryFn: () => apiClient(`/api/daily-summary/${date}`),
    enabled: isAuthenticated && !!date,
  });

  if (!isAuthenticated) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return '0 min';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins} min`;
  };

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
        <div className="flex items-center gap-3 mb-8">
          <Dumbbell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Workout Details</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {date ? formatDate(date) : 'No date'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <DashboardCard title="Loading...">
            <div className="text-center py-8 text-muted-foreground">
              Loading workout details...
            </div>
          </DashboardCard>
        ) : !workoutData || !workoutData.workout_minutes ? (
          <DashboardCard title="No Workout Data">
            <div className="text-center py-8">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                No workout was logged for this date.
              </p>
              <Link href="/workouts">
                <Button variant="outline" className="mt-4">
                  Log a Workout
                </Button>
              </Link>
            </div>
          </DashboardCard>
        ) : (
          <div className="space-y-6">
            {/* Duration Card */}
            <DashboardCard title="Workout Summary">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary/10 rounded-lg text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{formatDuration(workoutData.workout_minutes)}</p>
                  <p className="text-sm text-muted-foreground">Duration</p>
                </div>
                {workoutData.workout_type && (
                  <div className="p-4 bg-primary/10 rounded-lg text-center">
                    <Dumbbell className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold capitalize">{workoutData.workout_type}</p>
                    <p className="text-sm text-muted-foreground">Type</p>
                  </div>
                )}
              </div>
            </DashboardCard>

            {/* Workout Name */}
            {workoutData.workout_name && (
              <DashboardCard title="Workout Name">
                <p className="text-lg">{workoutData.workout_name}</p>
              </DashboardCard>
            )}

            {/* Breakdown */}
            {workoutData.workout_breakdown && (
              <DashboardCard title="Workout Breakdown">
                <div className="space-y-4">
                  {typeof workoutData.workout_breakdown === 'object' ? (
                    <>
                      {workoutData.workout_breakdown.strength && (
                        <div>
                          <h4 className="font-semibold mb-2">Strength Training</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {Array.isArray(workoutData.workout_breakdown.strength) ? 
                              workoutData.workout_breakdown.strength.map((ex: any, i: number) => (
                                <li key={i}>
                                  {ex.exercise} - {ex.weight} x {ex.reps}
                                </li>
                              )) :
                              <li>{JSON.stringify(workoutData.workout_breakdown.strength)}</li>
                            }
                          </ul>
                        </div>
                      )}
                      {workoutData.workout_breakdown.cardio && (
                        <div>
                          <h4 className="font-semibold mb-2">Cardio</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {Array.isArray(workoutData.workout_breakdown.cardio) ?
                              workoutData.workout_breakdown.cardio.map((c: any, i: number) => (
                                <li key={i}>
                                  {c.type} - {c.duration}
                                </li>
                              )) :
                              <li>{JSON.stringify(workoutData.workout_breakdown.cardio)}</li>
                            }
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {JSON.stringify(workoutData.workout_breakdown)}
                    </p>
                  )}
                </div>
              </DashboardCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
