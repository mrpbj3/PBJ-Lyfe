// PBJ Health - Meals Page
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
import { getTodayISO } from '@/lib/dateUtils';

export default function Meals() {
  const { isAuthenticated } = useAuth();
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string; calories: number; proteinG?: number }) => {
      await apiRequest('POST', '/api/meals', data);
    },
    onSuccess: () => {
      toast({ title: 'Meal logged successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/daily'] });
      setCalories('');
      setProtein('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cal = parseInt(calories);
    if (isNaN(cal) || cal <= 0) {
      toast({ title: 'Error', description: 'Please enter valid calories', variant: 'destructive' });
      return;
    }
    mutation.mutate({
      date: getTodayISO(),
      calories: cal,
      proteinG: protein ? parseFloat(protein) : undefined,
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
        <h1 className="text-3xl font-bold mb-8">Log Meal</h1>
        <DashboardCard title="Add Meal">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="Enter calories"
                data-testid="input-calories"
              />
            </div>
            <div>
              <Label htmlFor="protein">Protein (g) - Optional</Label>
              <Input
                id="protein"
                type="number"
                step="0.1"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="Enter protein in grams"
                data-testid="input-protein"
              />
            </div>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-log-meal">
              {mutation.isPending ? 'Logging...' : 'Log Meal'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
