"use client";

// PBJ Health - Mental Wellness Page
import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { DateSelector } from '@/components/DateSelector';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Smile, Meh, Frown } from 'lucide-react';
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
  const [mentalRating, setMentalRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing mental data for selected date
  const { data: existingData } = useQuery({
    queryKey: ['/api/daily-summary', selectedDate],
    queryFn: () => apiClient(`/api/daily-summary/${selectedDate}`),
    enabled: isAuthenticated,
  });

  // Update input when date changes and we have existing data
  useEffect(() => {
    if (existingData?.mental_rating) {
      setMentalRating(existingData.mental_rating);
    } else {
      setMentalRating(null);
    }
  }, [existingData, selectedDate]);

  const mutation = useMutation({
    mutationFn: async (data: { date: string; mentalRating: number }) => {
      const response = await fetch('/api/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save mental data');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Mental wellness logged successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-summary'] });
      setNotes('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mentalRating === null) {
      toast({ title: 'Error', description: 'Please select how you feel', variant: 'destructive' });
      return;
    }
    mutation.mutate({ date: selectedDate, mentalRating });
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
        <h1 className="text-3xl font-bold mb-8">Mental Wellness</h1>
        <DashboardCard title="How are you feeling?">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="mb-4 block">Rate your mental state</Label>
              <div className="flex gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => setMentalRating(1)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    mentalRating === 1 ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Frown className={`h-12 w-12 ${mentalRating === 1 ? 'text-red-500' : 'text-gray-400'}`} />
                  <p className="mt-2 text-sm font-medium">Bad</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMentalRating(2)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    mentalRating === 2 ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Meh className={`h-12 w-12 ${mentalRating === 2 ? 'text-yellow-500' : 'text-gray-400'}`} />
                  <p className="mt-2 text-sm font-medium">Okay</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMentalRating(3)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    mentalRating === 3 ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Smile className={`h-12 w-12 ${mentalRating === 3 ? 'text-green-500' : 'text-gray-400'}`} />
                  <p className="mt-2 text-sm font-medium">Great</p>
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How are you feeling today?"
                rows={3}
              />
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Logging...' : 'Log Mental Wellness'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
