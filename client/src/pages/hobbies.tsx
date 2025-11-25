// PBJ Health - Hobbies Page
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
import { getYesterdayISO } from '@/lib/dateUtils';

export default function Hobbies() {
  const { isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getYesterdayISO());
  const [hobby, setHobby] = useState('');
  const [duration, setDuration] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string; hobbiesMinutes: number }) => {
      await apiRequest('POST', '/api/daily-summary', data);
    },
    onSuccess: () => {
      toast({ title: 'Hobby logged successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/7d'] });
      setHobby('');
      setDuration('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseInt(duration) || 0;
    if (!hobby.trim() && minutes === 0) {
      toast({ title: 'Error', description: 'Please enter a hobby or duration', variant: 'destructive' });
      return;
    }
    mutation.mutate({ 
      date: selectedDate, 
      hobbiesMinutes: minutes
    });
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
        <h1 className="text-3xl font-bold mb-8">Hobbies</h1>
        <DashboardCard title="Log your hobby time">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="hobby">Hobby Activity</Label>
              <Input
                id="hobby"
                value={hobby}
                onChange={(e) => setHobby(e.target.value)}
                placeholder="Reading, guitar, cooking, gaming..."
                className="mt-2"
                data-testid="input-hobby-activity"
              />
            </div>
            
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 30"
                className="mt-2"
                data-testid="input-hobby-duration"
              />
            </div>

            <Button type="submit" disabled={mutation.isPending} data-testid="button-log-hobby">
              {mutation.isPending ? 'Logging...' : 'Log Hobby'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
