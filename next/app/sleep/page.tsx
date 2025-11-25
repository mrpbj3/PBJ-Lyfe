"use client";

// PBJ Health - Sleep Logging Page
// Mirrors daily check-in sleep section:
// - Went to bed (datetime)
// - Woke up (datetime)
// - Dream type: None / Dream / Nightmare
// - If Dream or Nightmare: show description textarea
import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { DateSelector } from '@/components/DateSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Moon } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// Compute sleep hours from bedtime and wake time
function computeSleepHours(bedtime: string, wakeTime: string): number {
  if (!bedtime || !wakeTime) return 0;
  const bed = new Date(bedtime);
  const wake = new Date(wakeTime);
  const diffMs = wake.getTime() - bed.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  return Math.round(hours * 10) / 10; // Round to 1 decimal
}

export default function SleepPage() {
  const { user, isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [bedtime, setBedtime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [dreamType, setDreamType] = useState<'none' | 'dream' | 'nightmare'>('none');
  const [dreamDesc, setDreamDesc] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing sleep data for selected date
  const { data: existingData } = useQuery({
    queryKey: ['/api/daily-summary', selectedDate],
    queryFn: () => apiClient(`/api/daily-summary/${selectedDate}`),
    enabled: isAuthenticated,
  });

  // Update input when date changes and we have existing data
  useEffect(() => {
    if (existingData?.bedtime) {
      setBedtime(existingData.bedtime);
    } else {
      setBedtime('');
    }
    if (existingData?.wake_time) {
      setWakeTime(existingData.wake_time);
    } else {
      setWakeTime('');
    }
    if (existingData?.dream_type) {
      setDreamType(existingData.dream_type as 'none' | 'dream' | 'nightmare');
    } else {
      setDreamType('none');
    }
    if (existingData?.dream_desc) {
      setDreamDesc(existingData.dream_desc);
    } else {
      setDreamDesc('');
    }
  }, [existingData, selectedDate]);

  const mutation = useMutation({
    mutationFn: async (data: { 
      date: string; 
      sleepHours: number; 
      bedtime?: string; 
      wakeTime?: string;
      dreamType?: string;
      dreamDesc?: string;
    }) => {
      const response = await fetch('/api/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save sleep data');
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: 'Sleep logged successfully!',
        className: 'bg-green-500 text-white fixed bottom-4 right-4'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/7d'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive',
        className: 'fixed bottom-4 right-4'
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bedtime || !wakeTime) {
      toast({ 
        title: 'Error', 
        description: 'Please enter both bedtime and wake time', 
        variant: 'destructive',
        className: 'fixed bottom-4 right-4'
      });
      return;
    }
    
    const hours = computeSleepHours(bedtime, wakeTime);
    
    if (hours <= 0) {
      toast({ 
        title: 'Error', 
        description: 'Wake time must be after bedtime', 
        variant: 'destructive',
        className: 'fixed bottom-4 right-4'
      });
      return;
    }
    
    // Auto-fill "No Memory" if dream/nightmare selected but no description
    const finalDreamDesc = (dreamType !== 'none' && !dreamDesc.trim()) ? 'No Memory' : dreamDesc;
    
    mutation.mutate({ 
      date: selectedDate, 
      sleepHours: hours,
      bedtime,
      wakeTime,
      dreamType,
      dreamDesc: dreamType !== 'none' ? finalDreamDesc : undefined,
    });
  };

  if (!isAuthenticated) return null;

  const sleepHours = computeSleepHours(bedtime, wakeTime);
  const showDreamDesc = dreamType !== 'none';

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
          <Moon className="h-8 w-8" />
          Log Sleep
        </h1>
        <DashboardCard title="Last Night's Sleep">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bedtime">Went to bed</Label>
                <Input
                  id="bedtime"
                  type="datetime-local"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  data-testid="input-bedtime"
                />
              </div>
              <div>
                <Label htmlFor="wakeTime">Woke up</Label>
                <Input
                  id="wakeTime"
                  type="datetime-local"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  data-testid="input-waketime"
                />
              </div>
            </div>
            
            {sleepHours > 0 && (
              <div className="p-4 bg-accent/50 rounded-lg">
                <p className="text-lg font-semibold">
                  Sleep duration: {sleepHours} hours
                </p>
              </div>
            )}

            {/* Dream Type - matches daily check-in */}
            <div>
              <Label className="mb-3 block">Did you have any dreams?</Label>
              <RadioGroup 
                value={dreamType} 
                onValueChange={(val) => setDreamType(val as 'none' | 'dream' | 'nightmare')}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none" className="font-normal cursor-pointer">None</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dream" id="dream" />
                  <Label htmlFor="dream" className="font-normal cursor-pointer">Dream</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nightmare" id="nightmare" />
                  <Label htmlFor="nightmare" className="font-normal cursor-pointer">Nightmare</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Dream Description - only show if Dream or Nightmare selected */}
            {showDreamDesc && (
              <div>
                <Label htmlFor="dreamDesc">Describe your {dreamType}</Label>
                <Textarea
                  id="dreamDesc"
                  value={dreamDesc}
                  onChange={(e) => setDreamDesc(e.target.value)}
                  placeholder="Leave blank to auto-fill 'No Memory'"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank to auto-fill "No Memory"
                </p>
              </div>
            )}
            
            <Button type="submit" disabled={mutation.isPending} className="w-full" data-testid="button-log-sleep">
              {mutation.isPending ? 'Logging...' : 'Log Sleep'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
