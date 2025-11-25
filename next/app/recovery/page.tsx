"use client";

// PBJ Health - Recovery Page (Drug Use Tracking)
import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { DateSelector } from '@/components/DateSelector';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  const [drugUseFlag, setDrugUseFlag] = useState(false);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing recovery data for selected date
  const { data: existingData } = useQuery({
    queryKey: ['/api/daily-summary', selectedDate],
    queryFn: () => apiClient(`/api/daily-summary/${selectedDate}`),
    enabled: isAuthenticated,
  });

  // Update input when date changes
  useEffect(() => {
    if (existingData?.drug_use_flag !== undefined) {
      setDrugUseFlag(existingData.drug_use_flag);
    } else {
      setDrugUseFlag(false);
    }
  }, [existingData, selectedDate]);

  const mutation = useMutation({
    mutationFn: async (data: { date: string; drugUseFlag: boolean }) => {
      const response = await fetch('/api/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save recovery data');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Recovery log saved!' });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-summary'] });
      setNotes('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ date: selectedDate, drugUseFlag });
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
        <h1 className="text-3xl font-bold mb-8">Recovery Tracking</h1>
        <DashboardCard title="Log Recovery Status">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="drugUse" className="text-base">Did you use any substances today?</Label>
                <p className="text-sm text-muted-foreground">This helps track your recovery progress</p>
              </div>
              <Switch
                id="drugUse"
                checked={drugUseFlag}
                onCheckedChange={setDrugUseFlag}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How are you feeling in your recovery journey?"
                rows={3}
              />
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Recovery Log'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
