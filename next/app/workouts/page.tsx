"use client";

import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Clock } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { getTodayISO } from '@/lib/dateUtils';

interface StrengthExercise {
  name: string;
  weight: string;
  reps: string;
}

interface CardioExercise {
  type: string;
  duration: string;
}

interface WorkoutSession {
  startTime: string;
  endTime: string;
  strengthExercises: StrengthExercise[];
  cardioExercises: CardioExercise[];
}

const createEmptySession = (): WorkoutSession => ({
  startTime: '',
  endTime: '',
  strengthExercises: [{ name: '', weight: '', reps: '' }],
  cardioExercises: [{ type: '', duration: '' }],
});

export default function WorkoutsPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [sessions, setSessions] = useState<WorkoutSession[]>([createEmptySession()]);
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
      sessions: WorkoutSession[];
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
    setSessions([createEmptySession()]);
    setNotes('');
  };

  // Session handlers
  const addSession = () => {
    setSessions([...sessions, createEmptySession()]);
  };

  const removeSession = (sessionIdx: number) => {
    if (sessions.length > 1) {
      setSessions(sessions.filter((_, i) => i !== sessionIdx));
    }
  };

  const updateSessionTime = (sessionIdx: number, field: 'startTime' | 'endTime', value: string) => {
    const newSessions = [...sessions];
    newSessions[sessionIdx][field] = value;
    setSessions(newSessions);
  };

  // Strength exercise handlers
  const addStrengthExercise = (sessionIdx: number) => {
    const newSessions = [...sessions];
    newSessions[sessionIdx].strengthExercises.push({ name: '', weight: '', reps: '' });
    setSessions(newSessions);
  };

  const removeStrengthExercise = (sessionIdx: number, exerciseIdx: number) => {
    const newSessions = [...sessions];
    if (newSessions[sessionIdx].strengthExercises.length > 1) {
      newSessions[sessionIdx].strengthExercises = newSessions[sessionIdx].strengthExercises.filter((_, i) => i !== exerciseIdx);
      setSessions(newSessions);
    }
  };

  const updateStrengthExercise = (sessionIdx: number, exerciseIdx: number, field: keyof StrengthExercise, value: string) => {
    const newSessions = [...sessions];
    newSessions[sessionIdx].strengthExercises[exerciseIdx][field] = value;
    setSessions(newSessions);
  };

  // Cardio exercise handlers
  const addCardioExercise = (sessionIdx: number) => {
    const newSessions = [...sessions];
    newSessions[sessionIdx].cardioExercises.push({ type: '', duration: '' });
    setSessions(newSessions);
  };

  const removeCardioExercise = (sessionIdx: number, exerciseIdx: number) => {
    const newSessions = [...sessions];
    if (newSessions[sessionIdx].cardioExercises.length > 1) {
      newSessions[sessionIdx].cardioExercises = newSessions[sessionIdx].cardioExercises.filter((_, i) => i !== exerciseIdx);
      setSessions(newSessions);
    }
  };

  const updateCardioExercise = (sessionIdx: number, exerciseIdx: number, field: keyof CardioExercise, value: string) => {
    const newSessions = [...sessions];
    newSessions[sessionIdx].cardioExercises[exerciseIdx][field] = value;
    setSessions(newSessions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one session has some data
    const hasValidData = sessions.some(session => {
      const hasStrength = session.strengthExercises.some(ex => ex.name.trim());
      const hasCardio = session.cardioExercises.some(ex => ex.type.trim() && ex.duration.trim());
      return hasStrength || hasCardio;
    });

    if (!hasValidData) {
      toast({ title: 'Error', description: 'Please add at least one exercise', variant: 'destructive' });
      return;
    }
    
    mutation.mutate({ 
      date: selectedDate,
      sessions,
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
        <DashboardCard title="Date" className="mb-6">
          <div>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-lg"
            />
          </div>
        </DashboardCard>

        <form onSubmit={handleSubmit} className="space-y-6">
          {sessions.map((session, sessionIdx) => (
            <DashboardCard 
              key={sessionIdx} 
              title={`Session ${sessionIdx + 1}`}
              className="border-l-4 border-l-primary"
            >
              <div className="space-y-6">
                {/* Session Times */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-1 mb-2">
                      <Clock className="h-4 w-4" />
                      Start Time
                    </Label>
                    <Input
                      type="time"
                      value={session.startTime}
                      onChange={(e) => updateSessionTime(sessionIdx, 'startTime', e.target.value)}
                      placeholder="--:-- --"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1 mb-2">
                      <Clock className="h-4 w-4" />
                      End Time
                    </Label>
                    <Input
                      type="time"
                      value={session.endTime}
                      onChange={(e) => updateSessionTime(sessionIdx, 'endTime', e.target.value)}
                      placeholder="--:-- --"
                    />
                  </div>
                </div>

                {/* Workouts Section */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-4">Workouts</h4>
                  
                  {/* Strength Training */}
                  <div className="mb-6">
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">Strength</Label>
                    <div className="space-y-3">
                      {session.strengthExercises.map((exercise, exerciseIdx) => (
                        <div key={exerciseIdx} className="flex gap-2 items-start">
                          <div className="flex-1 grid grid-cols-3 gap-2">
                            <Input
                              placeholder="Exercise"
                              value={exercise.name}
                              onChange={(e) => updateStrengthExercise(sessionIdx, exerciseIdx, 'name', e.target.value)}
                            />
                            <Input
                              placeholder="Weight"
                              value={exercise.weight}
                              onChange={(e) => updateStrengthExercise(sessionIdx, exerciseIdx, 'weight', e.target.value)}
                            />
                            <Input
                              placeholder="Reps"
                              value={exercise.reps}
                              onChange={(e) => updateStrengthExercise(sessionIdx, exerciseIdx, 'reps', e.target.value)}
                            />
                          </div>
                          {session.strengthExercises.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStrengthExercise(sessionIdx, exerciseIdx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addStrengthExercise(sessionIdx)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Exercise
                      </Button>
                    </div>
                  </div>

                  {/* Cardio */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">Cardio</Label>
                    <div className="space-y-3">
                      {session.cardioExercises.map((exercise, exerciseIdx) => (
                        <div key={exerciseIdx} className="flex gap-2 items-start">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <Select
                              value={exercise.type}
                              onValueChange={(value) => updateCardioExercise(sessionIdx, exerciseIdx, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Type" />
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
                            <Input
                              placeholder="Duration (min)"
                              type="number"
                              value={exercise.duration}
                              onChange={(e) => updateCardioExercise(sessionIdx, exerciseIdx, 'duration', e.target.value)}
                            />
                          </div>
                          {session.cardioExercises.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCardioExercise(sessionIdx, exerciseIdx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addCardioExercise(sessionIdx)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Cardio
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Remove Session Button */}
                {sessions.length > 1 && (
                  <div className="border-t pt-4">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeSession(sessionIdx)}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remove Session
                    </Button>
                  </div>
                )}
              </div>
            </DashboardCard>
          ))}

          {/* Add Another Session */}
          <DashboardCard title="Add another session?" className="border-dashed">
            <div className="text-center">
              <Button
                type="button"
                variant="outline"
                onClick={addSession}
              >
                <Plus className="h-4 w-4 mr-1" /> Yes, Add Session
              </Button>
            </div>
          </DashboardCard>

          {/* Notes */}
          <DashboardCard title="Notes">
            <div>
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
