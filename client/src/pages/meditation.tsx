// PBJ Health - Meditation Page
import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
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
  const [manualDuration, setManualDuration] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string; durationMin: number; type?: string }) => {
      await apiRequest('POST', '/api/meditation', data);
    },
    onSuccess: () => {
      toast({ 
        title: 'Meditation session logged!',
        className: 'bg-green-500 text-white border-green-600'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/daily'] });
      setManualDuration('');
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive',
        className: 'bg-red-500 text-white border-red-600'
      });
    },
  });

  useEffect(() => {
    if (!isRunning) return;
    
    const cleanup = startFiveMinTimer(
      (secLeft) => setTimeLeft(secLeft),
      () => {
        setIsRunning(false);
        setTimeLeft(300);
        // Auto-record with type "quick session" when timer completes
        mutation.mutate({ date: selectedDate, durationMin: 5, type: 'quick session' });
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
    const duration = parseInt(manualDuration);
    if (isNaN(duration) || duration <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid duration', variant: 'destructive' });
      return;
    }
    mutation.mutate({ date: selectedDate, durationMin: duration });
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
        
        {/* Date Picker */}
        <DashboardCard title="Select Date" className="mb-6">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              data-testid="input-meditation-date"
            />
          </div>
        </DashboardCard>

        {/* Meditate Now Section */}
        <DashboardCard title="Meditate now?" className="mb-6">
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
                  Cancel
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Find a quiet place, close your eyes, and focus on your breath.
              {isRunning && <br />}
              {isRunning && "Timer will auto-record when complete."}
            </p>
          </div>
        </DashboardCard>

        {/* Manual Log Section */}
        <DashboardCard title="Log a Past Session">
          <form onSubmit={handleManualLog} className="space-y-4">
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={manualDuration}
                onChange={(e) => setManualDuration(e.target.value)}
                placeholder="Enter duration in minutes"
                data-testid="input-meditation-duration"
              />
            </div>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-log-meditation">
              {mutation.isPending ? 'Logging...' : 'Log Session'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
