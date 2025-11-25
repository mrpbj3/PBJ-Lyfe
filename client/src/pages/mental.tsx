// PBJ Health - Mental Health Page
import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { DateSelector } from '@/components/DateSelector';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getTodayISO } from '@/lib/dateUtils';

export default function Mental() {
  const { isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [rating, setRating] = useState<'great' | 'ok' | 'bad'>('ok');
  const [why, setWhy] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Map rating to numeric value for daily_summary
  const ratingToNumber = (r: string): number => {
    switch (r) {
      case 'great': return 3;
      case 'ok': return 2;
      case 'bad': return 1;
      default: return 2;
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: { date: string; mentalRating: number }) => {
      await apiRequest('POST', '/api/daily-summary', data);
    },
    onSuccess: () => {
      toast({ title: 'Mental health logged successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/daily'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/7d'] });
      setWhy('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ 
      date: selectedDate, 
      mentalRating: ratingToNumber(rating)
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
        <h1 className="text-3xl font-bold mb-8">Mental Health Check-In</h1>
        <DashboardCard title="How are you feeling?">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Your mood</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <Button
                  type="button"
                  variant={rating === 'great' ? 'default' : 'outline'}
                  onClick={() => setRating('great')}
                  data-testid="button-rating-great"
                >
                  Great
                </Button>
                <Button
                  type="button"
                  variant={rating === 'ok' ? 'default' : 'outline'}
                  onClick={() => setRating('ok')}
                  data-testid="button-rating-ok"
                >
                  OK
                </Button>
                <Button
                  type="button"
                  variant={rating === 'bad' ? 'default' : 'outline'}
                  onClick={() => setRating('bad')}
                  data-testid="button-rating-bad"
                >
                  Bad
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="why">Why? (Optional)</Label>
              <Textarea
                id="why"
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                placeholder="What made it great/ok/bad?"
                rows={4}
                data-testid="input-why"
              />
            </div>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-log-mental">
              {mutation.isPending ? 'Logging...' : 'Log Mental Health'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
