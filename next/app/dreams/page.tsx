"use client";

// PBJ Health - Dreams Page
// Asks for: went to bed, woke up, dream/nightmare/none, description
import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { DateSelector } from '@/components/DateSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, CloudMoon } from 'lucide-react';
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

export default function Page() {
  const { user, isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [bedtime, setBedtime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [dreamType, setDreamType] = useState<'dream' | 'nightmare' | 'none'>('none');
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
      setDreamType(existingData.dream_type as 'dream' | 'nightmare' | 'none');
      setDreamDesc(existingData.dream_desc || '');
    } else {
      setDreamType('none');
      setDreamDesc('');
    }
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
  }, [existingData, selectedDate]);

  const mutation = useMutation({
    mutationFn: async (data: { 
      date: string; 
      dreamType: string; 
      dreamDesc?: string;
      sleepHours?: number;
      bedtime?: string;
      wakeTime?: string;
    }) => {
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
    
    // Compute sleep hours from bedtime and wake time
    const sleepHours = computeSleepHours(bedtime, wakeTime);
    
    // If no description and dream/nightmare selected, auto-fill with "No Memory"
    const finalDesc = (dreamType !== 'none' && !dreamDesc.trim()) ? 'No Memory' : dreamDesc;
    
    mutation.mutate({ 
      date: selectedDate, 
      dreamType,
      dreamDesc: dreamType !== 'none' ? finalDesc : undefined,
      sleepHours: sleepHours > 0 ? sleepHours : undefined,
      bedtime: bedtime || undefined,
      wakeTime: wakeTime || undefined,
    });
  };

  if (!isAuthenticated) return null;

  const sleepHours = computeSleepHours(bedtime, wakeTime);

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
        <DashboardCard title="Log Your Sleep & Dreams">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sleep Times */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bedtime">Went to bed</Label>
                <Input
                  id="bedtime"
                  type="datetime-local"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="wakeTime">Woke up</Label>
                <Input
                  id="wakeTime"
                  type="datetime-local"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                />
              </div>
            </div>
            
            {sleepHours > 0 && (
              <p className="text-sm text-muted-foreground">
                Sleep duration: <span className="font-semibold">{sleepHours} hours</span>
              </p>
            )}

            {/* Dream Type Radio Buttons */}
            <div>
              <Label className="mb-3 block">Did you dream?</Label>
              <RadioGroup 
                value={dreamType} 
                onValueChange={(val) => setDreamType(val as 'dream' | 'nightmare' | 'none')}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dream" id="dream" />
                  <Label htmlFor="dream" className="font-normal cursor-pointer">Dream</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nightmare" id="nightmare" />
                  <Label htmlFor="nightmare" className="font-normal cursor-pointer">Nightmare</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none" className="font-normal cursor-pointer">None / Don't remember</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Dream Description - only show if Dream or Nightmare selected */}
            {dreamType !== 'none' && (
              <div>
                <Label htmlFor="dreamDesc">Describe your {dreamType}</Label>
                <Textarea
                  id="dreamDesc"
                  value={dreamDesc}
                  onChange={(e) => setDreamDesc(e.target.value)}
                  placeholder="Leave blank to auto-fill 'No Memory'"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank to auto-fill "No Memory"
                </p>
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
