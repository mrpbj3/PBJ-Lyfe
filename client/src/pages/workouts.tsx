// PBJ Health - Workouts Page
import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { DateSelector } from '@/components/DateSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getTodayISO } from '@/lib/dateUtils';

export default function Workouts() {
  const { isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string; workoutMinutes: number }) => {
      // Save to daily_summary
      await apiRequest('POST', '/api/daily-summary', data);
    },
    onSuccess: () => {
      toast({ title: 'Workout logged successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/daily'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/7d'] });
      setStart('');
      setEnd('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    
    // Calculate duration in minutes
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const workoutMinutes = Math.max(0, endMinutes - startMinutes);

    mutation.mutate({ date: selectedDate, workoutMinutes });
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
        <h1 className="text-3xl font-bold mb-8">Log Workout</h1>
        <DashboardCard title="Workout Session">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="start">Check In (time)</Label>
              <Input
                id="start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                data-testid="input-workout-start"
              />
            </div>
            <div>
              <Label htmlFor="end">Check Out (time)</Label>
              <Input
                id="end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                data-testid="input-workout-end"
              />
            </div>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-log-workout">
              {mutation.isPending ? 'Logging...' : 'Log Workout'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
