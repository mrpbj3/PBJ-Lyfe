"use client";

import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getTodayISO } from '@/lib/dateUtils';

export default function MentalPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [rating, setRating] = useState<string>('ok');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string; rating: string; why?: string }) => {
      await apiRequest('POST', '/api/mental', data);
    },
    onSuccess: () => {
      toast({ 
        title: 'Mental wellness logged!',
        className: 'bg-green-500 text-white border-green-600'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/daily'] });
      setRating('ok');
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
    mutation.mutate({ 
      date: selectedDate, 
      rating,
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
        <h1 className="text-3xl font-bold mb-8">Mental Wellness</h1>
        
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

        <DashboardCard title="How are you feeling?">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Mental State</Label>
              <RadioGroup value={rating} onValueChange={setRating} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="great" id="great" />
                  <Label htmlFor="great">Great 😊</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ok" id="ok" />
                  <Label htmlFor="ok">OK 😐</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bad" id="bad" />
                  <Label htmlFor="bad">Not Good 😔</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="notes">Why? (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share what's on your mind..."
                rows={4}
              />
            </div>

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Logging...' : 'Log Mental State'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
