// PBJ Health - Meditation Page
import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { DateSelector } from '@/components/DateSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { startFiveMinTimer, formatTimerDisplay } from '@/lib/mental/meditation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getTodayISO } from '@/lib/dateUtils';

export default function Meditation() {
  const { isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [timeLeft, setTimeLeft] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [manualMinutes, setManualMinutes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string; meditationMinutes: number }) => {
      await apiRequest('POST', '/api/daily-summary', data);
    },
    onSuccess: () => {
      toast({ title: 'Meditation session logged!' });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/daily'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/7d'] });
      setManualMinutes('');
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
        mutation.mutate({ date: selectedDate, meditationMinutes: 5 });
      }
    );
    
    return cleanup;
  }, [isRunning, selectedDate]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    setTimeLeft(300);
  };

  const handleManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseInt(manualMinutes);
    if (isNaN(minutes) || minutes <= 0) {
      toast({ title: 'Error', description: 'Please enter valid minutes', variant: 'destructive' });
      return;
    }
    mutation.mutate({ date: selectedDate, meditationMinutes: minutes });
  };

  if (!isAuthenticated) return null;

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

      <DateSelector date={selectedDate} onDateChange={setSelectedDate} />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Meditation</h1>
        
        <DashboardCard title="5-Minute Mindfulness" className="mb-6">
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

        <DashboardCard title="Log Manual Entry">
          <form onSubmit={handleManualLog} className="space-y-4">
            <div>
              <Label htmlFor="minutes">Meditation Duration (minutes)</Label>
              <Input
                id="minutes"
                type="number"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(e.target.value)}
                placeholder="e.g., 15"
                data-testid="input-meditation-minutes"
              />
            </div>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-log-meditation">
              {mutation.isPending ? 'Logging...' : 'Log Meditation'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
