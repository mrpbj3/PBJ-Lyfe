"use client";

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
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export default function Page() {
  const { user, isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [mealsDescription, setMealsDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const calculateWithAI = async () => {
    if (!mealsDescription.trim()) {
      toast({ title: 'Error', description: 'Please describe your meals first', variant: 'destructive' });
      return;
    }

    setIsCalculating(true);
    try {
      const response = await fetch('/api/calculate-calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealsDescription }),
      });

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

  const mutation = useMutation({
    mutationFn: async (data: { date: string; caloriesTotal: number }) => {
      const response = await fetch('/api/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save nutrition data');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Nutrition logged successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/7d'] });
      setMealsDescription('');
      setCalories('');
      setProtein('');
      setFat('');
      setCarbs('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cal = parseInt(calories);
    if (isNaN(cal) || cal < 0) {
      toast({ title: 'Error', description: 'Please enter valid calories', variant: 'destructive' });
      return;
    }
    mutation.mutate({ date: selectedDate, caloriesTotal: cal });
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
        
        <DashboardCard title="AI Calorie Calculator" className="mb-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="meals">Describe your meals</Label>
              <Textarea
                id="meals"
                value={mealsDescription}
                onChange={(e) => setMealsDescription(e.target.value)}
                placeholder="e.g., Breakfast: 2 eggs, toast with butter. Lunch: Chicken salad with olive oil dressing. Dinner: Salmon with rice and vegetables..."
                rows={4}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={calculateWithAI}
              disabled={isCalculating || !mealsDescription.trim()}
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isCalculating ? 'Calculating...' : 'Calculate with AI'}
            </Button>
          </div>
        </DashboardCard>

        <DashboardCard title="Nutrition Details">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="e.g., 2000"
                />
              </div>
              <div>
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="e.g., 120"
                />
              </div>
              <div>
                <Label htmlFor="fat">Fat (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="e.g., 65"
                />
              </div>
              <div>
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="e.g., 250"
                />
              </div>
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Logging...' : 'Log Nutrition'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
