"use client";

import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { getTodayISO } from '@/lib/dateUtils';

interface Exercise {
  name: string;
  weight: string;
  reps: string;
}

export default function WorkoutsPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([{ name: '', weight: '', reps: '' }]);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recentWorkouts } = useQuery({
    queryKey: ['workouts', 'recent', user?.id],
    queryFn: () => apiClient('/api/workouts'),
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: async (data: { date: string; startAt: string; endAt: string; exercises: string[]; notes?: string }) => {
      await apiRequest('POST', '/api/workouts', data);
    },
    onSuccess: () => {
      toast({ 
        title: 'Workout logged!',
        className: 'bg-green-500 text-white border-green-600'
      });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/daily'] });
      setStartTime('');
      setEndTime('');
      setExercises([{ name: '', weight: '', reps: '' }]);
      setNotes('');
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

  const addExercise = () => {
    setExercises([...exercises, { name: '', weight: '', reps: '' }]);
  };

  const removeExercise = (index: number) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index));
    }
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string) => {
    const newExercises = [...exercises];
    newExercises[index][field] = value;
    setExercises(newExercises);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      toast({ title: 'Error', description: 'Please enter start and end times', variant: 'destructive' });
      return;
    }
    
    const exerciseStrings = exercises
      .filter(ex => ex.name.trim())
      .map(ex => `${ex.name} - ${ex.weight} x ${ex.reps}`);
    
    mutation.mutate({ 
      date: selectedDate,
      startAt: `${selectedDate}T${startTime}`,
      endAt: `${selectedDate}T${endTime}`,
      exercises: exerciseStrings,
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
        <h1 className="text-3xl font-bold mb-8">Workouts</h1>
        
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

        <DashboardCard title="Log Workout">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start">Start Time</Label>
                <Input
                  id="start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end">End Time</Label>
                <Input
                  id="end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Exercises</Label>
              <div className="space-y-2 mt-2">
                {exercises.map((exercise, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Exercise"
                        value={exercise.name}
                        onChange={(e) => updateExercise(idx, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Weight"
                        value={exercise.weight}
                        onChange={(e) => updateExercise(idx, 'weight', e.target.value)}
                      />
                      <Input
                        placeholder="Reps"
                        value={exercise.reps}
                        onChange={(e) => updateExercise(idx, 'reps', e.target.value)}
                      />
                    </div>
                    {exercises.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExercise(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addExercise}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Exercise
              </Button>
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did the workout feel?"
                rows={3}
              />
            </div>

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Logging...' : 'Log Workout'}
            </Button>
          </form>
        </DashboardCard>

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
