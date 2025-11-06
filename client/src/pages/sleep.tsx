// PBJ Health - Sleep Logging Page
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';

export default function Sleep() {
  const { isAuthenticated } = useAuth();
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
        setTimeout(() => { window.location.href = '/api/login'; }, 500);
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
    mutation.mutate({ startAt: start, endAt: end });
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
        <h1 className="text-3xl font-bold mb-8">Log Sleep</h1>
        <DashboardCard title="Sleep Session">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="start">Sleep Start</Label>
              <Input
                id="start"
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                data-testid="input-sleep-start"
              />
            </div>
            <div>
              <Label htmlFor="end">Sleep End</Label>
              <Input
                id="end"
                type="datetime-local"
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
