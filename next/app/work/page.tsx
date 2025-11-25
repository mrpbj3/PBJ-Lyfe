"use client";

import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getTodayISO } from '@/lib/dateUtils';

export default function WorkPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [stressLevel, setStressLevel] = useState<string>('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string; stress: string; why?: string }) => {
      await apiRequest('POST', '/api/work', data);
    },
    onSuccess: () => {
      toast({ 
        title: 'Work stress logged!',
        className: 'bg-green-500 text-white border-green-600'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/daily'] });
      setStressLevel('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stressLevel) {
      toast({ title: 'Error', description: 'Please select a stress level', variant: 'destructive' });
      return;
    }
    mutation.mutate({ 
      date: selectedDate, 
      stress: stressLevel,
      why: notes || undefined
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
        <h1 className="text-3xl font-bold mb-8">Work Stress</h1>
        
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

        <DashboardCard title="How was work?">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Stress Level</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <Button
                  type="button"
                  variant={stressLevel === 'low' ? 'default' : 'outline'}
                  onClick={() => setStressLevel('low')}
                  className="w-full"
                >
                  Low
                </Button>
                <Button
                  type="button"
                  variant={stressLevel === 'medium' ? 'default' : 'outline'}
                  onClick={() => setStressLevel('medium')}
                  className="w-full"
                >
                  Medium
                </Button>
                <Button
                  type="button"
                  variant={stressLevel === 'high' ? 'default' : 'outline'}
                  onClick={() => setStressLevel('high')}
                  className="w-full"
                >
                  High
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Why? (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What made work stressful or easy?"
                rows={4}
              />
              <p className="text-sm text-destructive font-semibold mt-2">
                DO NOT SHARE SENSITIVE INFORMATION ABOUT YOUR JOB
              </p>
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
