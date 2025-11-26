"use client";

import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Dumbbell, Heart } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { getTodayISO } from '@/lib/dateUtils';

interface StrengthExercise {
  name: string;
  sets: string;
  reps: string;
  weight: string;
}

interface CardioExercise {
  type: string;
  duration: string;
  distance: string;
  intensity: string;
}

export default function WorkoutsPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [workoutType, setWorkoutType] = useState<'strength' | 'cardio' | 'both'>('strength');
  
  // Strength workout state
  const [strengthExercises, setStrengthExercises] = useState<StrengthExercise[]>([
    { name: '', sets: '', reps: '', weight: '' }
  ]);
  
  // Cardio workout state
  const [cardioExercises, setCardioExercises] = useState<CardioExercise[]>([
    { type: '', duration: '', distance: '', intensity: 'moderate' }
  ]);
  
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recentWorkouts } = useQuery({
    queryKey: ['workouts', 'recent', user?.id],
    queryFn: () => apiClient('/api/workouts'),
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: async (data: { 
      date: string; 
      workoutType: string;
      strengthExercises?: string[];
      cardioExercises?: string[];
      notes?: string;
    }) => {
      await apiRequest('POST', '/api/workouts', data);
    },
    onSuccess: () => {
      toast({ 
        title: 'Workout logged!',
        className: 'bg-green-500 text-white border-green-600'
      });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/daily'] });
      resetForm();
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

  const resetForm = () => {
    setStrengthExercises([{ name: '', sets: '', reps: '', weight: '' }]);
    setCardioExercises([{ type: '', duration: '', distance: '', intensity: 'moderate' }]);
    setNotes('');
  };

  // Strength exercise handlers
  const addStrengthExercise = () => {
    setStrengthExercises([...strengthExercises, { name: '', sets: '', reps: '', weight: '' }]);
  };

  const removeStrengthExercise = (index: number) => {
    if (strengthExercises.length > 1) {
      setStrengthExercises(strengthExercises.filter((_, i) => i !== index));
    }
  };

  const updateStrengthExercise = (index: number, field: keyof StrengthExercise, value: string) => {
    const newExercises = [...strengthExercises];
    newExercises[index][field] = value;
    setStrengthExercises(newExercises);
  };

  // Cardio exercise handlers
  const addCardioExercise = () => {
    setCardioExercises([...cardioExercises, { type: '', duration: '', distance: '', intensity: 'moderate' }]);
  };

  const removeCardioExercise = (index: number) => {
    if (cardioExercises.length > 1) {
      setCardioExercises(cardioExercises.filter((_, i) => i !== index));
    }
  };

  const updateCardioExercise = (index: number, field: keyof CardioExercise, value: string) => {
    const newExercises = [...cardioExercises];
    newExercises[index][field] = value;
    setCardioExercises(newExercises);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const strengthStrings = strengthExercises
      .filter(ex => ex.name.trim())
      .map(ex => `${ex.name}: ${ex.sets} sets x ${ex.reps} reps @ ${ex.weight}`);
    
    const cardioStrings = cardioExercises
      .filter(ex => ex.type.trim())
      .map(ex => `${ex.type}: ${ex.duration} min, ${ex.distance || 'N/A'}, ${ex.intensity} intensity`);
    
    if ((workoutType === 'strength' || workoutType === 'both') && strengthStrings.length === 0 && 
        (workoutType === 'cardio' || workoutType === 'both') && cardioStrings.length === 0) {
      toast({ title: 'Error', description: 'Please add at least one exercise', variant: 'destructive' });
      return;
    }
    
    mutation.mutate({ 
      date: selectedDate,
      workoutType,
      strengthExercises: strengthStrings.length > 0 ? strengthStrings : undefined,
      cardioExercises: cardioStrings.length > 0 ? cardioStrings : undefined,
      notes: notes || undefined
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
        <h1 className="text-3xl font-bold mb-8">Log Workout</h1>
        
        {/* Date Picker */}
        <DashboardCard title="Select Date" className="mb-6">
          <div>
            <Label htmlFor="date">Workout Date</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </DashboardCard>

        {/* Workout Type Selection */}
        <DashboardCard title="Workout Type" className="mb-6">
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={workoutType === 'strength' ? 'default' : 'outline'}
              onClick={() => setWorkoutType('strength')}
              className="flex items-center gap-2"
            >
              <Dumbbell className="h-4 w-4" />
              Strength
            </Button>
            <Button
              type="button"
              variant={workoutType === 'cardio' ? 'default' : 'outline'}
              onClick={() => setWorkoutType('cardio')}
              className="flex items-center gap-2"
            >
              <Heart className="h-4 w-4" />
              Cardio
            </Button>
            <Button
              type="button"
              variant={workoutType === 'both' ? 'default' : 'outline'}
              onClick={() => setWorkoutType('both')}
            >
              Both
            </Button>
          </div>
        </DashboardCard>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Strength Training Section */}
          {(workoutType === 'strength' || workoutType === 'both') && (
            <DashboardCard title="Strength Training" className="border-l-4 border-l-blue-500">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Log your strength exercises (weight lifting, resistance training, etc.)
                </p>
                
                {strengthExercises.map((exercise, idx) => (
                  <div key={idx} className="p-3 border rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Exercise {idx + 1}</span>
                      {strengthExercises.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStrengthExercise(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <Input
                          placeholder="Exercise name (e.g., Bench Press)"
                          value={exercise.name}
                          onChange={(e) => updateStrengthExercise(idx, 'name', e.target.value)}
                        />
                      </div>
                      <Input
                        placeholder="Sets"
                        type="number"
                        value={exercise.sets}
                        onChange={(e) => updateStrengthExercise(idx, 'sets', e.target.value)}
                      />
                      <Input
                        placeholder="Reps"
                        type="number"
                        value={exercise.reps}
                        onChange={(e) => updateStrengthExercise(idx, 'reps', e.target.value)}
                      />
                      <div className="col-span-2">
                        <Input
                          placeholder="Weight (e.g., 135 lbs)"
                          value={exercise.weight}
                          onChange={(e) => updateStrengthExercise(idx, 'weight', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStrengthExercise}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Strength Exercise
                </Button>
              </div>
            </DashboardCard>
          )}

          {/* Cardio Section */}
          {(workoutType === 'cardio' || workoutType === 'both') && (
            <DashboardCard title="Cardio" className="border-l-4 border-l-red-500">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Log your cardio activities (running, cycling, swimming, etc.)
                </p>
                
                {cardioExercises.map((exercise, idx) => (
                  <div key={idx} className="p-3 border rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Activity {idx + 1}</span>
                      {cardioExercises.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCardioExercise(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <Select
                          value={exercise.type}
                          onValueChange={(value) => updateCardioExercise(idx, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select activity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="running">Running</SelectItem>
                            <SelectItem value="walking">Walking</SelectItem>
                            <SelectItem value="cycling">Cycling</SelectItem>
                            <SelectItem value="swimming">Swimming</SelectItem>
                            <SelectItem value="rowing">Rowing</SelectItem>
                            <SelectItem value="elliptical">Elliptical</SelectItem>
                            <SelectItem value="stairmaster">Stairmaster</SelectItem>
                            <SelectItem value="hiit">HIIT</SelectItem>
                            <SelectItem value="jump_rope">Jump Rope</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        placeholder="Duration (minutes)"
                        type="number"
                        value={exercise.duration}
                        onChange={(e) => updateCardioExercise(idx, 'duration', e.target.value)}
                      />
                      <Input
                        placeholder="Distance (optional)"
                        value={exercise.distance}
                        onChange={(e) => updateCardioExercise(idx, 'distance', e.target.value)}
                      />
                      <div className="col-span-2">
                        <Select
                          value={exercise.intensity}
                          onValueChange={(value) => updateCardioExercise(idx, 'intensity', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Intensity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low Intensity</SelectItem>
                            <SelectItem value="moderate">Moderate Intensity</SelectItem>
                            <SelectItem value="high">High Intensity</SelectItem>
                            <SelectItem value="interval">Interval Training</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCardioExercise}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Cardio Activity
                </Button>
              </div>
            </DashboardCard>
          )}

          {/* Notes */}
          <DashboardCard title="Notes">
            <div>
              <Label htmlFor="notes">Workout Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did the workout feel? Any personal records?"
                rows={3}
              />
            </div>
          </DashboardCard>

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? 'Logging Workout...' : 'Log Workout'}
          </Button>
        </form>

        {/* Recent Workouts */}
        {recentWorkouts && Array.isArray(recentWorkouts) && recentWorkouts.length > 0 && (
          <DashboardCard title="Recent Workouts" className="mt-6">
            <div className="space-y-2">
              {recentWorkouts.slice(0, 7).map((workout: any) => (
                <Link 
                  key={workout.id || workout.date} 
                  href={`/workouts/${workout.date || workout.for_date}`}
                  className="block p-3 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {new Date(workout.date || workout.for_date).toLocaleDateString()}
                    </span>
                    <span className="text-muted-foreground">
                      {workout.durationMin || workout.workout_minutes || 0} min
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </DashboardCard>
        )}
      </div>
    </div>
  );
}
