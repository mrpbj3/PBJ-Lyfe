// PBJ Health - Profile & Settings Page
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ['/api/goals'],
    enabled: isAuthenticated,
  });

  const [goalWeight, setGoalWeight] = useState('');
  const [kcalGoal, setKcalGoal] = useState('2000');
  const [stepGoal, setStepGoal] = useState('10000');

  // Update state when goals data loads
  useEffect(() => {
    if (goals) {
      setGoalWeight(goals.goalWeightKg?.toString() || '');
      setKcalGoal(goals.kcalGoal?.toString() || '2000');
      setStepGoal(goals.stepGoal?.toString() || '10000');
    }
  }, [goals]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('PUT', '/api/goals', data);
    },
    onSuccess: () => {
      toast({ title: 'Goals updated successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      goalWeightKg: goalWeight ? parseFloat(goalWeight) : undefined,
      kcalGoal: parseInt(kcalGoal),
      stepGoal: parseInt(stepGoal),
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
        <h1 className="text-3xl font-bold mb-8">Profile & Settings</h1>
        
        <DashboardCard title="User Info" className="mb-6">
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Name:</span> {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm">
              <span className="font-medium">Email:</span> {user?.email}
            </p>
          </div>
        </DashboardCard>

        <DashboardCard title="Health Goals">
          {goalsLoading ? (
            <div className="text-sm text-muted-foreground">Loading goals...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="goalWeight">Goal Weight (kg)</Label>
              <Input
                id="goalWeight"
                type="number"
                step="0.1"
                value={goalWeight}
                onChange={(e) => setGoalWeight(e.target.value)}
                placeholder="75.0"
                data-testid="input-goal-weight"
              />
            </div>
            <div>
              <Label htmlFor="kcalGoal">Daily Calorie Goal</Label>
              <Input
                id="kcalGoal"
                type="number"
                value={kcalGoal}
                onChange={(e) => setKcalGoal(e.target.value)}
                data-testid="input-kcal-goal"
              />
            </div>
            <div>
              <Label htmlFor="stepGoal">Daily Step Goal</Label>
              <Input
                id="stepGoal"
                type="number"
                value={stepGoal}
                onChange={(e) => setStepGoal(e.target.value)}
                data-testid="input-step-goal"
              />
            </div>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-save-goals">
              {mutation.isPending ? 'Saving...' : 'Save Goals'}
            </Button>
          </form>
          )}
        </DashboardCard>
      </div>
    </div>
  );
}
