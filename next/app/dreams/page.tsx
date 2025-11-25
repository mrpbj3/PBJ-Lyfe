"use client";

import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getTodayISO } from '@/lib/dateUtils';

export default function DreamsPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [title, setTitle] = useState('');
  const [narrative, setNarrative] = useState('');
  const [dreamType, setDreamType] = useState<string>('good_dream');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string; title: string; narrative: string; dreamType: string }) => {
      await apiRequest('POST', '/api/dreams', data);
    },
    onSuccess: () => {
      toast({ 
        title: 'Dream logged successfully!',
        className: 'bg-green-500 text-white border-green-600'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dreams'] });
      setTitle('');
      setNarrative('');
      setDreamType('good_dream');
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
    if (!title || !narrative) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    mutation.mutate({ date: selectedDate, title, narrative, dreamType });
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
        <h1 className="text-3xl font-bold mb-8">Dream Journal</h1>
        
        {/* Date Picker */}
        <DashboardCard title="Select Date" className="mb-6">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              data-testid="input-dream-date"
            />
          </div>
        </DashboardCard>

        <DashboardCard title="Log Dream">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Dream Type</Label>
              <Select value={dreamType} onValueChange={setDreamType}>
                <SelectTrigger data-testid="select-dream-type">
                  <SelectValue placeholder="Select dream type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="good_dream">Good Dream</SelectItem>
                  <SelectItem value="neutral_dream">Neutral Dream</SelectItem>
                  <SelectItem value="nightmare">Nightmare</SelectItem>
                  <SelectItem value="lucid_dream">Lucid Dream</SelectItem>
                  <SelectItem value="recurring_dream">Recurring Dream</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What was your dream about?"
                data-testid="input-dream-title"
              />
            </div>
            <div>
              <Label htmlFor="narrative">Description</Label>
              <Textarea
                id="narrative"
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder="Describe what happened in your dream..."
                rows={6}
                data-testid="input-dream-narrative"
              />
            </div>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-log-dream">
              {mutation.isPending ? 'Logging...' : 'Log Dream'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
