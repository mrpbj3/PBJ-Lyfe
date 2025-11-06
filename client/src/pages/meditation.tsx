// PBJ Health - Meditation Page
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { startFiveMinTimer, formatTimerDisplay } from '@/lib/mental/meditation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getTodayISO } from '@/lib/dateUtils';

export default function Meditation() {
  const { isAuthenticated } = useAuth();
  const [timeLeft, setTimeLeft] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string; durationMin: number }) => {
      await apiRequest('POST', '/api/meditation', data);
    },
    onSuccess: () => {
      toast({ title: 'Meditation session logged!' });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/daily'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (!isRunning) return;
    
    const cleanup = startFiveMinTimer(
      (secLeft) => setTimeLeft(secLeft),
      () => {
        setIsRunning(false);
        setTimeLeft(300);
        mutation.mutate({ date: getTodayISO(), durationMin: 5 });
      }
    );
    
    return cleanup;
  }, [isRunning]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    setTimeLeft(300);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Today
            </Button>
          </Link>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Meditation</h1>
        <DashboardCard title="5-Minute Mindfulness">
          <div className="text-center space-y-6">
            <div className="text-6xl font-mono font-bold text-primary">
              {formatTimerDisplay(timeLeft)}
            </div>
            <div className="flex gap-4 justify-center">
              {!isRunning ? (
                <Button size="lg" onClick={handleStart} data-testid="button-start-timer">
                  Start 5-Min Session
                </Button>
              ) : (
                <Button size="lg" variant="destructive" onClick={handleStop} data-testid="button-stop-timer">
                  Stop
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Find a quiet place, close your eyes, and focus on your breath
            </p>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
