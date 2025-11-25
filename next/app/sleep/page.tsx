"use client";

// PBJ Health - Sleep Logging Page
import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { DateSelector } from '@/components/DateSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export default function SleepPage() {
  const { user, isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [sleepHours, setSleepHours] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing sleep data for selected date
  const { data: existingData } = useQuery({
    queryKey: ['/api/daily-summary', selectedDate],
    queryFn: () => apiClient(`/api/daily-summary/${selectedDate}`),
    enabled: isAuthenticated,
  });

  // Update input when date changes and we have existing data
  useEffect(() => {
    if (existingData?.sleep_hours) {
      setSleepHours(existingData.sleep_hours.toString());
    } else {
      setSleepHours('');
    }
  }, [existingData, selectedDate]);

  const mutation = useMutation({
    mutationFn: async (data: { date: string; sleepHours: number }) => {
      const response = await fetch('/api/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save sleep data');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Sleep logged successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/7d'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(sleepHours);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      toast({ title: 'Error', description: 'Please enter valid hours (0-24)', variant: 'destructive' });
      return;
    }
    mutation.mutate({ date: selectedDate, sleepHours: hours });
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
        <h1 className="text-3xl font-bold mb-8">Log Sleep</h1>
        <DashboardCard title="Last Night's Sleep">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="sleep">Hours Slept</Label>
              <Input
                id="sleep"
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                placeholder="e.g., 7.5"
                data-testid="input-sleep-hours"
              />
            </div>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-log-sleep">
              {mutation.isPending ? 'Logging...' : 'Log Sleep'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
