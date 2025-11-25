"use client";

// PBJ Health - Meditation Page
// Includes: Log meditation manually + "Meditate Now?" 5-minute timer
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { DateSelector } from '@/components/DateSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Timer, Play, Pause, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

const MEDITATION_DURATION = 5 * 60; // 5 minutes in seconds

export default function Page() {
  const { user, isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [minutes, setMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(MEDITATION_DURATION);
  const [timerCompleted, setTimerCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch existing meditation data for selected date
  const { data: existingData } = useQuery({
    queryKey: ['/api/daily-summary', selectedDate],
    queryFn: () => apiClient(`/api/daily-summary/${selectedDate}`),
    enabled: isAuthenticated,
  });

  // Update input when date changes
  useEffect(() => {
    if (existingData?.meditation_minutes) {
      setMinutes(existingData.meditation_minutes.toString());
    } else {
      setMinutes('');
    }
  }, [existingData, selectedDate]);

  // Timer effect
  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer completed
            setTimerActive(false);
            setTimerCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerActive, timeRemaining]);

  // Auto-log meditation when timer completes
  useEffect(() => {
    if (timerCompleted) {
      logMeditationMutation.mutate({ 
        date: selectedDate, 
        meditationMinutes: 5 
      });
      setTimerCompleted(false);
    }
  }, [timerCompleted, selectedDate]);

  const logMeditationMutation = useMutation({
    mutationFn: async (data: { date: string; meditationMinutes: number }) => {
      const response = await fetch('/api/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save meditation data');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Meditation logged successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-summary'] });
      setNotes('');
      // Reset timer
      setTimeRemaining(MEDITATION_DURATION);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(minutes);
    if (isNaN(mins) || mins < 0) {
      toast({ title: 'Error', description: 'Please enter valid minutes', variant: 'destructive' });
      return;
    }
    logMeditationMutation.mutate({ date: selectedDate, meditationMinutes: mins });
  };

  const startTimer = () => {
    setTimerActive(true);
    setTimeRemaining(MEDITATION_DURATION);
  };

  const pauseTimer = () => {
    setTimerActive(false);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimeRemaining(MEDITATION_DURATION);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Timer className="h-8 w-8" />
          Meditation
        </h1>

        {/* Manual Log Section */}
        <DashboardCard title="Log Meditation Session">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <Label htmlFor="minutes">Duration (minutes)</Label>
              <Input
                id="minutes"
                type="number"
                min="0"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="e.g., 15"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How was your meditation session?"
                rows={3}
              />
            </div>
            <Button type="submit" disabled={logMeditationMutation.isPending}>
              {logMeditationMutation.isPending ? 'Logging...' : 'Log Meditation'}
            </Button>
          </form>
        </DashboardCard>

        {/* Meditate Now Timer Section */}
        <DashboardCard title="Meditate Now?">
          <div className="text-center space-y-6">
            <p className="text-muted-foreground">
              Start a quick 5-minute guided meditation session. When the timer completes, 
              it will automatically log the session.
            </p>
            
            {/* Timer Display */}
            <div className="text-6xl font-mono font-bold py-8">
              {formatTime(timeRemaining)}
            </div>

            {/* Timer Controls */}
            <div className="flex justify-center gap-4">
              {!timerActive ? (
                <Button 
                  onClick={startTimer} 
                  size="lg"
                  className="gap-2"
                  disabled={timeRemaining === 0}
                >
                  <Play className="h-5 w-5" />
                  {timeRemaining === MEDITATION_DURATION ? 'Start Meditation' : 'Resume'}
                </Button>
              ) : (
                <Button 
                  onClick={pauseTimer} 
                  size="lg"
                  variant="secondary"
                  className="gap-2"
                >
                  <Pause className="h-5 w-5" />
                  Pause
                </Button>
              )}
              
              {timeRemaining < MEDITATION_DURATION && (
                <Button 
                  onClick={resetTimer} 
                  size="lg"
                  variant="outline"
                  className="gap-2"
                >
                  <RotateCcw className="h-5 w-5" />
                  Reset
                </Button>
              )}
            </div>

            {timeRemaining === 0 && (
              <p className="text-green-600 font-semibold">
                🎉 Session complete! Meditation has been logged.
              </p>
            )}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
