"use client";

import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getTodayISO } from '@/lib/dateUtils';

export default function NutritionPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [mealsDescription, setMealsDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string; calories: number; proteinG?: number; fatG?: number; carbsG?: number; notes?: string }) => {
      await apiRequest('POST', '/api/meals', data);
    },
    onSuccess: () => {
      toast({ 
        title: 'Nutrition logged successfully!',
        className: 'bg-green-500 text-white border-green-600'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/daily'] });
      setMealsDescription('');
      setCalories('');
      setProtein('');
      setFat('');
      setCarbs('');
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

  const calculateWithAI = async () => {
    if (!mealsDescription.trim()) {
      toast({ title: 'Error', description: 'Please describe what you ate', variant: 'destructive' });
      return;
    }
    
    setIsCalculating(true);
    try {
      const response = await apiRequest('POST', '/api/calculate-calories', {
        mealsDescription: mealsDescription
      });
      
      if (!response.ok) {
        throw new Error('Failed to calculate calories');
      }
      
      const data = await response.json();
      setCalories(data.calories?.toString() || '');
      setProtein(data.protein?.toString() || '');
      setFat(data.fat?.toString() || '');
      setCarbs(data.carbs?.toString() || '');
      
      toast({ title: 'Calculation complete!', description: `Estimated ${data.calories} calories` });
    } catch (error) {
      toast({ 
        title: 'Calculation failed', 
        description: 'Please enter values manually',
        variant: 'destructive'
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cals = parseInt(calories);
    if (isNaN(cals) || cals <= 0) {
      toast({ title: 'Error', description: 'Please enter valid calories', variant: 'destructive' });
      return;
    }
    mutation.mutate({ 
      date: selectedDate, 
      calories: cals,
      proteinG: protein ? parseInt(protein) : undefined,
      fatG: fat ? parseInt(fat) : undefined,
      carbsG: carbs ? parseInt(carbs) : undefined,
      notes: mealsDescription
    });
  };

  if (!user) return null;

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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Nutrition</h1>
        
        {/* Date Picker */}
        <DashboardCard title="Select Date" className="mb-6">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </DashboardCard>

        <DashboardCard title="Log Meals">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="meals">What did you eat/drink?</Label>
              <Textarea
                id="meals"
                value={mealsDescription}
                onChange={(e) => setMealsDescription(e.target.value)}
                placeholder="Breakfast: 2 eggs, toast, coffee&#10;Lunch: Chicken salad&#10;Dinner: Pasta with sauce"
                rows={5}
              />
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={calculateWithAI}
              disabled={isCalculating || !mealsDescription.trim()}
              className="w-full"
            >
              {isCalculating ? 'Calculating...' : 'Calculate with AI'}
            </Button>

            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
              <div className="col-span-2">
                <Label htmlFor="calories">Calories Consumed</Label>
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
                  placeholder="e.g., 60"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="e.g., 200"
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
