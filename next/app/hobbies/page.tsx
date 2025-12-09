"use client";

import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getTodayISO } from '@/lib/dateUtils';

export default function HobbiesPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [hobby, setHobby] = useState('');
  const [duration, setDuration] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string; hobby: string; durationMin?: number }) => {
      await apiRequest('POST', '/api/hobbies', data);
    },
    onSuccess: () => {
      toast({ 
        title: 'Hobby activity logged!',
        className: 'bg-green-500 text-white border-green-600'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/daily'] });
      setHobby('');
      setDuration('');
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
    if (!hobby.trim()) {
      toast({ title: 'Error', description: 'Please enter a hobby', variant: 'destructive' });
      return;
    }
    mutation.mutate({ 
      date: selectedDate, 
      hobby,
      durationMin: duration ? parseInt(duration) : undefined
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
        <h1 className="text-3xl font-bold mb-8">Hobbies</h1>
        
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

        <DashboardCard title="Log Hobby Activity">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="hobby">Hobby</Label>
              <Input
                id="hobby"
                value={hobby}
                onChange={(e) => setHobby(e.target.value)}
                placeholder="Reading, guitar, cooking, gaming..."
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (minutes, optional)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 30"
              />
            </div>

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Logging...' : 'Log Hobby'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
