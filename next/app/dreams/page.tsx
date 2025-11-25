"use client";

// PBJ Health - Dreams Page
import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { DateSelector } from '@/components/DateSelector';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CloudMoon } from 'lucide-react';
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
  const [dreamType, setDreamType] = useState('none');
  const [dreamDesc, setDreamDesc] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing dream data for selected date
  const { data: existingData } = useQuery({
    queryKey: ['/api/daily-summary', selectedDate],
    queryFn: () => apiClient(`/api/daily-summary/${selectedDate}`),
    enabled: isAuthenticated,
  });

  // Update input when date changes
  useEffect(() => {
    if (existingData?.dream_type) {
      setDreamType(existingData.dream_type);
      setDreamDesc(existingData.dream_desc || '');
    } else {
      setDreamType('none');
      setDreamDesc('');
    }
  }, [existingData, selectedDate]);

  const mutation = useMutation({
    mutationFn: async (data: { date: string; dreamType: string; dreamDesc?: string }) => {
      const response = await fetch('/api/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save dream data');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Dream logged successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-summary'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ 
      date: selectedDate, 
      dreamType,
      dreamDesc: dreamType !== 'none' ? dreamDesc : undefined
    });
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
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <CloudMoon className="h-8 w-8" />
          Dreams
        </h1>
        <DashboardCard title="Log Your Dream">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="dreamType">Dream Type</Label>
              <Select value={dreamType} onValueChange={setDreamType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dream type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No dream / Don't remember</SelectItem>
                  <SelectItem value="good">Good dream</SelectItem>
                  <SelectItem value="neutral">Neutral dream</SelectItem>
                  <SelectItem value="nightmare">Nightmare</SelectItem>
                  <SelectItem value="lucid">Lucid dream</SelectItem>
                  <SelectItem value="recurring">Recurring dream</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dreamType !== 'none' && (
              <div>
                <Label htmlFor="dreamDesc">Describe your dream (optional)</Label>
                <Textarea
                  id="dreamDesc"
                  value={dreamDesc}
                  onChange={(e) => setDreamDesc(e.target.value)}
                  placeholder="What happened in your dream?"
                  rows={4}
                />
              </div>
            )}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Logging...' : 'Log Dream'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
