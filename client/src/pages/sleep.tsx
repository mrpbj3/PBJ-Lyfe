// PBJ Health - Sleep Logging Page
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
import { isUnauthorizedError } from '@/lib/authUtils';
import { getTodayISO } from '@/lib/dateUtils';

export default function Sleep() {
  const { isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { startAt: string; endAt: string }) => {
      await apiRequest('POST', '/api/sleep', data);
    },
    onSuccess: () => {
      toast({ title: 'Sleep logged successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/daily'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/7d'] });
      setStart('');
      setEnd('');
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: 'Unauthorized',
          description: 'You are logged out. Logging in again...',
          variant: 'destructive',
        });
        setTimeout(() => { window.location.href = '/login'; }, 500);
        return;
      }
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    // Combine date with times for full datetime
    const startAt = `${selectedDate}T${start}`;
    const endAt = `${selectedDate}T${end}`;
    mutation.mutate({ startAt, endAt });
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
        <h1 className="text-3xl font-bold mb-8">Log Sleep</h1>
        <DashboardCard title="Sleep Session" description="Log last night's sleep">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="start">Went to Bed (time)</Label>
              <Input
                id="start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                data-testid="input-sleep-start"
              />
            </div>
            <div>
              <Label htmlFor="end">Woke Up (time)</Label>
              <Input
                id="end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                data-testid="input-sleep-end"
              />
            </div>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-log-sleep">
              {mutation.isPending ? 'Logging...' : 'Log Sleep'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
