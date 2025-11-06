// PBJ Health - Work & Stress Page
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getYesterdayISO } from '@/lib/dateUtils';

export default function Work() {
  const { isAuthenticated } = useAuth();
  const [stress, setStress] = useState<'low' | 'medium' | 'high'>('medium');
  const [why, setWhy] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string; stress: string; why?: string }) => {
      await apiRequest('POST', '/api/work', data);
    },
    onSuccess: () => {
      toast({ title: 'Work log saved successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/work'] });
      setWhy('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ 
      date: getYesterdayISO(), 
      stress,
      why: why.trim() || undefined
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
        <h1 className="text-3xl font-bold mb-8">Work & Stress</h1>
        <DashboardCard title="How was work yesterday?">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Stress Level</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <Button
                  type="button"
                  variant={stress === 'low' ? 'default' : 'outline'}
                  onClick={() => setStress('low')}
                  data-testid="button-stress-low"
                >
                  Low
                </Button>
                <Button
                  type="button"
                  variant={stress === 'medium' ? 'default' : 'outline'}
                  onClick={() => setStress('medium')}
                  data-testid="button-stress-medium"
                >
                  Medium
                </Button>
                <Button
                  type="button"
                  variant={stress === 'high' ? 'default' : 'outline'}
                  onClick={() => setStress('high')}
                  data-testid="button-stress-high"
                >
                  High
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="why">Why? (optional)</Label>
              <Textarea
                id="why"
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                placeholder="What made work stressful or easy today?"
                className="mt-2"
                rows={3}
                data-testid="input-work-why"
              />
              <p className="text-sm text-destructive font-semibold mt-2" data-testid="text-work-disclaimer">
                DO NOT SHARE SENSITIVE INFORMATION ABOUT YOUR JOB
              </p>
            </div>

            <Button type="submit" disabled={mutation.isPending} data-testid="button-log-work">
              {mutation.isPending ? 'Logging...' : 'Log Work Stress'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
