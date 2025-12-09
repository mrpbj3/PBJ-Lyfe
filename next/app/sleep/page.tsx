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

export default function SleepPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [dreamType, setDreamType] = useState<string>('none');
  const [dreamDescription, setDreamDescription] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { startAt: string; endAt: string; dreamType: string; dreamDescription: string }) => {
      await apiRequest('POST', '/api/sleep', data);
    },
    onSuccess: () => {
      toast({ 
        title: 'Sleep logged successfully!',
        className: 'bg-green-500 text-white border-green-600'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/daily'] });
      setStart('');
      setEnd('');
      setDreamType('none');
      setDreamDescription('');
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
    if (!start || !end) {
      toast({ title: 'Error', description: 'Please fill in sleep times', variant: 'destructive' });
      return;
    }
    mutation.mutate({ 
      startAt: start, 
      endAt: end, 
      dreamType,
      dreamDescription: dreamType !== 'none' ? (dreamDescription || 'No Memory') : ''
    });
  };

  const handleAutofillNoMemory = () => {
    setDreamDescription('No Memory');
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
        <h1 className="text-3xl font-bold mb-8">Log Sleep</h1>
        
        {/* Date Picker */}
        <DashboardCard title="Select Date" className="mb-6">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              data-testid="input-sleep-date"
            />
          </div>
        </DashboardCard>

        <DashboardCard title="Sleep Session">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start">Went to bed</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  data-testid="input-sleep-start"
                />
              </div>
              <div>
                <Label htmlFor="end">Woke up</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  data-testid="input-sleep-end"
                />
              </div>
            </div>

            <div>
              <Label>Dream Type</Label>
              <Select value={dreamType} onValueChange={setDreamType}>
                <SelectTrigger data-testid="select-dream-type">
                  <SelectValue placeholder="Select dream type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="dream">Dream</SelectItem>
                  <SelectItem value="nightmare">Nightmare</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dreamType !== 'none' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="dreamDescription">Dream Description</Label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={handleAutofillNoMemory}
                  >
                    Auto-fill "No Memory"
                  </Button>
                </div>
                <Textarea
                  id="dreamDescription"
                  value={dreamDescription}
                  onChange={(e) => setDreamDescription(e.target.value)}
                  placeholder="Describe your dream..."
                  rows={4}
                  data-testid="textarea-dream-description"
                />
              </div>
            )}

            <Button type="submit" disabled={mutation.isPending} data-testid="button-log-sleep">
              {mutation.isPending ? 'Logging...' : 'Log Sleep'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
