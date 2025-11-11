// PBJ Health - Weight Logging Page
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

export default function Weight() {
  const { isAuthenticated } = useAuth();
  const [weightKg, setWeightKg] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string; weightKg: number }) => {
      await apiRequest('POST', '/api/weight', data);
    },
    onSuccess: () => {
      toast({ title: 'Weight logged successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/weight'] });
      setWeightKg('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = parseFloat(weightKg);
    if (isNaN(weight) || weight <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid weight', variant: 'destructive' });
      return;
    }
    mutation.mutate({ date: getTodayISO(), weightKg: weight });
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
        <h1 className="text-3xl font-bold mb-8">Log Weight</h1>
        <DashboardCard title="Body Metrics">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="Enter weight in kg"
                data-testid="input-weight"
              />
            </div>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-log-weight">
              {mutation.isPending ? 'Logging...' : 'Log Weight'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
