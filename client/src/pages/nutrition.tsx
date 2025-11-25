// PBJ Health - Nutrition Page
import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { DateSelector } from '@/components/DateSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getTodayISO } from '@/lib/dateUtils';

export default function Nutrition() {
  const { isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [mealsDescription, setMealsDescription] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string; calories: number; proteinG?: number; fatG?: number; carbsG?: number; notes?: string }) => {
      await apiRequest('POST', '/api/meals', data);
    },
    onSuccess: () => {
      toast({ title: 'Meal logged successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/daily'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/7d'] });
      setCalories('');
      setProtein('');
      setFat('');
      setCarbs('');
      setMealsDescription('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const calculateWithAI = async () => {
    if (!mealsDescription.trim()) {
      toast({ title: 'Error', description: 'Please describe what you ate', variant: 'destructive' });
      return;
    }

    setIsCalculating(true);
    try {
      const response = await apiRequest('POST', '/api/calculate-calories', {
        mealsDescription: mealsDescription,
      });

      // apiRequest throws if response is not ok, so we can directly parse JSON
      const data = await response.json();
      
      if (data.calories) setCalories(data.calories.toString());
      if (data.protein) setProtein(data.protein.toString());
      if (data.fat) setFat(data.fat.toString());
      if (data.carbs) setCarbs(data.carbs.toString());

      toast({ title: 'Success', description: `Estimated ${data.calories} calories` });
    } catch (error) {
      console.error('AI calculation error:', error);
      toast({ title: 'Error', description: 'Failed to calculate. Please enter manually.', variant: 'destructive' });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cal = parseInt(calories);
    if (isNaN(cal) || cal <= 0) {
      toast({ title: 'Error', description: 'Please enter valid calories', variant: 'destructive' });
      return;
    }
    mutation.mutate({
      date: selectedDate,
      calories: cal,
      proteinG: protein ? parseFloat(protein) : undefined,
      fatG: fat ? parseFloat(fat) : undefined,
      carbsG: carbs ? parseFloat(carbs) : undefined,
      notes: mealsDescription || undefined,
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
        <h1 className="text-3xl font-bold mb-8">Log Nutrition</h1>
        
        {/* AI Calculation Card */}
        <DashboardCard title="Calculate with AI" description="Describe your meals and let AI estimate calories" className="mb-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="meals">What did you eat/drink?</Label>
              <Textarea
                id="meals"
                value={mealsDescription}
                onChange={(e) => setMealsDescription(e.target.value)}
                placeholder="Breakfast: 2 eggs, toast, coffee&#10;Lunch: Chicken salad, water&#10;Dinner: Pasta, wine&#10;Snacks: Apple, protein bar"
                rows={5}
                data-testid="textarea-meals"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={calculateWithAI}
              disabled={isCalculating || !mealsDescription.trim()}
              className="w-full"
              data-testid="button-calculate-ai"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isCalculating ? 'Calculating...' : 'Calculate with AI'}
            </Button>
          </div>
        </DashboardCard>

        {/* Manual Entry Card */}
        <DashboardCard title="Nutrition Details">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="calories">Calories *</Label>
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
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  step="0.1"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                  data-testid="input-protein"
                />
              </div>
              <div>
                <Label htmlFor="fat">Fat (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  step="0.1"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="0"
                  data-testid="input-fat"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  step="0.1"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                  data-testid="input-carbs"
                />
              </div>
            </div>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-log-meal">
              {mutation.isPending ? 'Logging...' : 'Log Nutrition'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
