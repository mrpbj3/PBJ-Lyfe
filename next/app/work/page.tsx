"use client";

// PBJ Health - Work Stress Page
import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { DateSelector } from '@/components/DateSelector';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, TrendingDown, Minus, TrendingUp } from 'lucide-react';
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
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing work data for selected date
  const { data: existingData } = useQuery({
    queryKey: ['/api/daily-summary', selectedDate],
    queryFn: () => apiClient(`/api/daily-summary/${selectedDate}`),
    enabled: isAuthenticated,
  });

  // Update input when date changes
  useEffect(() => {
    if (existingData?.work_stress_level) {
      setStressLevel(existingData.work_stress_level);
    } else {
      setStressLevel(null);
    }
  }, [existingData, selectedDate]);

  const mutation = useMutation({
    mutationFn: async (data: { date: string; workStressLevel: number }) => {
      const response = await fetch('/api/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save work data');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Work stress logged successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-summary'] });
      setNotes('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stressLevel === null) {
      toast({ title: 'Error', description: 'Please select a stress level', variant: 'destructive' });
      return;
    }
    mutation.mutate({ date: selectedDate, workStressLevel: stressLevel });
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
        <h1 className="text-3xl font-bold mb-8">Work Stress</h1>
        <DashboardCard title="How was work stress today?">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="mb-4 block">Rate your stress level</Label>
              <div className="flex gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => setStressLevel(1)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    stressLevel === 1 ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <TrendingDown className={`h-12 w-12 ${stressLevel === 1 ? 'text-green-500' : 'text-gray-400'}`} />
                  <p className="mt-2 text-sm font-medium">Low</p>
                </button>
                <button
                  type="button"
                  onClick={() => setStressLevel(2)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    stressLevel === 2 ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Minus className={`h-12 w-12 ${stressLevel === 2 ? 'text-yellow-500' : 'text-gray-400'}`} />
                  <p className="mt-2 text-sm font-medium">Medium</p>
                </button>
                <button
                  type="button"
                  onClick={() => setStressLevel(3)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    stressLevel === 3 ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <TrendingUp className={`h-12 w-12 ${stressLevel === 3 ? 'text-red-500' : 'text-gray-400'}`} />
                  <p className="mt-2 text-sm font-medium">High</p>
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What made work stressful or calm today?"
                rows={3}
              />
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Logging...' : 'Log Work Stress'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
