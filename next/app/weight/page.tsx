"use client";

// PBJ Health - Weight Logging Page
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

export default function Page() {
  const { user, isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [weightKg, setWeightKg] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing weight for selected date
  const { data: existingData } = useQuery({
    queryKey: ['/api/daily-summary', selectedDate],
    queryFn: () => apiClient(`/api/daily-summary/${selectedDate}`),
    enabled: isAuthenticated,
  });

  // Update input when date changes and we have existing data
  useEffect(() => {
    if (existingData?.weight_kg) {
      setWeightKg(existingData.weight_kg.toString());
    } else {
      setWeightKg('');
    }
  }, [existingData, selectedDate]);

  const mutation = useMutation({
    mutationFn: async (data: { date: string; weightKg: number }) => {
      const response = await fetch('/api/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save weight');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Weight logged successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/7d'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = parseFloat(weightKg);
    if (isNaN(weight) || weight <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid weight', variant: 'destructive' });
      return;
    }
    mutation.mutate({ date: selectedDate, weightKg: weight });
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
        <h1 className="text-3xl font-bold mb-8">Log Weight</h1>
        <DashboardCard title="Body Metrics">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="Enter weight in kg"
                data-testid="input-weight"
              />
            </div>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-log-weight">
              {mutation.isPending ? 'Logging...' : 'Log Weight'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
