// PBJ Health - Today Dashboard
// Main daily tracking screen with all health cards
import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { DashboardCard } from '@/components/DashboardCard';
import { StatusChip } from '@/components/StatusChip';
import { EmptyState } from '@/components/EmptyState';
import HeaderMenu from '@/components/HeaderMenu';
import { Button } from '@/components/ui/button';
import { DailyCheckInWizard } from '@/components/DailyCheckInWizard';
import {
  Activity,
  Moon,
  Scale,
  Utensils,
  Dumbbell,
  Brain,
  Briefcase,
  Heart,
  Home,
  Coffee,
  Wind,
  Sparkles,
} from 'lucide-react';
import { getTodayISO } from '@/lib/dateUtils';

interface DailyAnalytics {
  date: string;
  sleepHours: number;
  calories: number;
  workouts: number;
  weight: number | null;
  scoreSmall: number;
  kcalGoal: number;
}

interface Streaks {
  greenDays: number;
  onTrackDays: number;
}

export default function Today() {
  const { user, loading: isLoading, isAuthenticated, signOut } = useAuth();
  const { toast } = useToast();
  const today = getTodayISO();
  const [showWizard, setShowWizard] = useState(false);

  // RequireAuth component already handles authentication
  // No need for additional redirect logic here
  
  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  // Fetch today's analytics
  const { data: dailyAnalytics } = useQuery<DailyAnalytics>({
    queryKey: ['/api/analytics/daily', today],
    enabled: isAuthenticated,
  });

  // Fetch current streaks
  const { data: streaks } = useQuery<Streaks>({
    queryKey: ['/api/streaks/current'],
    enabled: isAuthenticated,
  });

  // Auto-show wizard on first visit of the day
  useEffect(() => {
    if (isAuthenticated && dailyAnalytics) {
      const lastCheckInDate = localStorage.getItem('lastCheckInDate');
      const hasCompletedToday = localStorage.getItem('completedCheckIn_' + today);
      
      // Show wizard if:
      // 1. Haven't seen it today
      // 2. No data logged yet (scoreSmall is 0)
      if (!hasCompletedToday && dailyAnalytics.scoreSmall === 0 && lastCheckInDate !== today) {
        setShowWizard(true);
      }
    }
  }, [isAuthenticated, dailyAnalytics, today]);

  const handleWizardClose = () => {
    setShowWizard(false);
    localStorage.setItem('completedCheckIn_' + today, 'true');
    localStorage.setItem('lastCheckInDate', today);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const greenStreak = streaks?.greenDays || 0;
  const onTrackStreak = streaks?.onTrackDays || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Daily Check-In Wizard */}
      <DailyCheckInWizard
        isOpen={showWizard}
        onClose={handleWizardClose}
        userId={user?.id || ''}
        userFirstName={user?.firstName ?? undefined}
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
      {/* Welcome Message */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {user?.firstName || 'there'}!
          </h2>
          <p className="text-muted-foreground">
            Today Date: {new Date().toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Lyfe Tracking - Quick Access Row */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-center mb-6">How's Lyfe?</h3>
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
        <div className="mb-8 p-8 rounded-xl border bg-card">
          <div className="text-center">
            {greenStreak > 0 ? (
              <>
                <p className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {greenStreak} {greenStreak === 1 ? 'Day' : 'Days'}
                </p>
                <p className="text-xl font-semibold uppercase tracking-wide text-green-600 dark:text-green-400 mb-2">
                  GREEN STREAK
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  You're doing great!
                </p>
                <p className="text-base font-semibold text-yellow-600 dark:text-yellow-400">
                  Overall Streak {greenStreak + onTrackStreak} {greenStreak + onTrackStreak === 1 ? 'Day' : 'Days'}
                </p>
              </>
            ) : onTrackStreak > 0 ? (
              <>
                <p className="text-5xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                  {onTrackStreak} {onTrackStreak === 1 ? 'Day' : 'Days'}
                </p>
                <p className="text-xl font-semibold uppercase tracking-wide text-yellow-600 dark:text-yellow-400 mb-2">
                  ACTIVE STREAK
                </p>
                <p className="text-sm text-muted-foreground">
                  Don't even think about falling off. Look how far you've come!
                </p>
              </>
            ) : (
              <>
                <p className="text-5xl font-bold text-red-600 dark:text-red-400 mb-2">
                  0 Days
                </p>
                <p className="text-xl font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 mb-2">
                  NO ACTIVE STREAK
                </p>
                <p className="text-sm text-muted-foreground">
                  You said "better." Time to mean it.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Main Dashboard Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Sleep Card */}
          <DashboardCard
            title="Sleep"
            description="Log your sleep sessions"
            actionLabel="Log"
            actionHref="/sleep"
            testId="card-sleep"
          >
            {dailyAnalytics?.sleepHours ? (
              <div className="space-y-2">
                <p className="text-3xl font-bold">{dailyAnalytics.sleepHours.toFixed(1)}h</p>
                <p className="text-sm text-muted-foreground">
                  {dailyAnalytics.sleepHours >= 6 ? '✓ Goal met' : 'Need 6+ hours'}
                </p>
              </div>
            ) : (
              <EmptyState
                icon={Moon}
                title="No sleep logged"
                description="Track your sleep to build your streak"
              />
            )}
          </DashboardCard>

          {/* Weigh-In Card */}
          <DashboardCard
            title="Weight"
            description="Track your body metrics"
            actionLabel="Log"
            actionHref="/weight"
            testId="card-weight"
          >
            {dailyAnalytics?.weight ? (
              <div className="space-y-2">
                <p className="text-3xl font-bold">{Math.round(dailyAnalytics.weight)} lbs</p>
                <p className="text-sm text-muted-foreground">
                  {dailyAnalytics.weight > 0 ? 'Logged today' : ''}
                </p>
              </div>
            ) : (
              <EmptyState
                icon={Scale}
                title="No weight logged today"
                description="Log your morning weight for trend tracking"
              />
            )}
          </DashboardCard>

          {/* Nutrition Card */}
          <DashboardCard
            title="Nutrition"
            description="Track your daily nutrition"
            actionLabel="Add Meal"
            actionHref="/nutrition"
            testId="card-calories"
          >
            {dailyAnalytics?.calories ? (
              <div className="space-y-2">
                <p className="text-3xl font-bold">{dailyAnalytics.calories} cal</p>
                <p className="text-sm text-muted-foreground">
                  {dailyAnalytics.scoreSmall >= 2 ? '✓ On track' : 'Keep logging meals'}
                </p>
              </div>
            ) : (
              <EmptyState
                icon={Utensils}
                title="No meals logged"
                description="Add your meals to track calories"
              />
            )}
          </DashboardCard>

          {/* Workout Card */}
          <DashboardCard
            title="Workouts"
            description="Log your exercise sessions"
            actionLabel="Log"
            actionHref="/workouts"
            testId="card-workout"
          >
            {dailyAnalytics?.workouts ? (
              <div className="space-y-2">
                <p className="text-3xl font-bold">✓ Logged</p>
                <p className="text-sm text-muted-foreground">
                  {dailyAnalytics.workouts} {dailyAnalytics.workouts === 1 ? 'session' : 'sessions'} today
                </p>
              </div>
            ) : (
              <EmptyState
                icon={Dumbbell}
                title="No workout logged"
                description="Check in when you start your workout"
              />
            )}
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}

function LifeButton({ icon: Icon, label, href }: { icon: any; label: string; href: string }) {
  return (
    <a href={href} data-testid={`link-${label.toLowerCase()}`}>
      <Button
        variant="outline"
        className="w-full h-16 flex-col gap-1 hover-elevate"
      >
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </Button>
    </a>
  );
}
