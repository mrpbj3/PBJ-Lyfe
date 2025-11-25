// PBJ Health - Social Activities Page
import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getTodayISO } from '@/lib/dateUtils';

export default function Social() {
  const { isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [activity, setActivity] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string; activity: string; durationMin?: number }) => {
      await apiRequest('POST', '/api/social', data);
    },
    onSuccess: () => {
      toast({ 
        title: 'Social activity logged successfully!',
        className: 'bg-green-500 text-white border-green-600'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/social'] });
      setActivity('');
      setDurationMin('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.trim()) {
      toast({ title: 'Error', description: 'Please describe the activity', variant: 'destructive' });
      return;
    }
    mutation.mutate({
      date: selectedDate,
      activity: activity.trim(),
      durationMin: durationMin ? parseInt(durationMin) : undefined,
    });
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
        <h1 className="text-3xl font-bold mb-8">Social Activities</h1>
        
        {/* Date Picker */}
        <DashboardCard title="Select Date" className="mb-6">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              data-testid="input-social-date"
            />
          </div>
        </DashboardCard>

        <DashboardCard title="Log Social Activity">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="activity">Social Activity</Label>
              <Input
                id="activity"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="Dinner with friends, phone call with family..."
                data-testid="input-social-activity"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes, optional)</Label>
              <Input
                id="duration"
                type="number"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder="60"
                data-testid="input-social-duration"
              />
            </div>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-log-social">
              {mutation.isPending ? 'Logging...' : 'Log Activity'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
