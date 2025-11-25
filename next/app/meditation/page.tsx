"use client";

// PBJ Health - Meditation Page
import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { DateSelector } from '@/components/DateSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export default function Page() {
  const { user, isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [minutes, setMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const mutation = useMutation({
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
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(minutes);
    if (isNaN(mins) || mins < 0) {
      toast({ title: 'Error', description: 'Please enter valid minutes', variant: 'destructive' });
      return;
    }
    mutation.mutate({ date: selectedDate, meditationMinutes: mins });
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
        <h1 className="text-3xl font-bold mb-8">Meditation</h1>
        <DashboardCard title="Log Meditation Session">
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Logging...' : 'Log Meditation'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
