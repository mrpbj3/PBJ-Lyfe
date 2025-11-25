"use client";

// PBJ Health - Dreams Page
// Mirrors daily check-in sleep/dreams step exactly
// Dream types: None, Good Dream, Neutral Dream, Nightmare, Lucid Dream, Recurring Dream
import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { DateSelector } from '@/components/DateSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// Compute sleep hours from bedtime and wake time
function computeSleepHours(bedtime: string, wakeTime: string): number {
  if (!bedtime || !wakeTime) return 0;
  const bed = new Date(bedtime);
  const wake = new Date(wakeTime);
  const diffMs = wake.getTime() - bed.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  return Math.round(hours * 10) / 10; // Round to 1 decimal
}

// Dream type options matching daily check-in
const DREAM_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'good_dream', label: 'Good Dream' },
  { value: 'neutral_dream', label: 'Neutral Dream' },
  { value: 'nightmare', label: 'Nightmare' },
  { value: 'lucid_dream', label: 'Lucid Dream' },
  { value: 'recurring_dream', label: 'Recurring Dream' },
];

export default function Page() {
  const { user, isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [bedtime, setBedtime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
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
      toast({ 
        title: 'Dream logged successfully!',
        className: 'bg-green-500 text-white fixed bottom-4 right-4'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-summary'] });
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
    
    // Compute sleep hours from bedtime and wake time
    const sleepHours = computeSleepHours(bedtime, wakeTime);
    
    // If no description and dream type selected (not none), auto-fill with "No Memory"
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
  const showDescription = dreamType !== 'none';

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
              <div className="p-3 bg-accent/50 rounded-lg">
                <p className="text-sm">
                  Sleep duration: <span className="font-semibold">{sleepHours} hours</span>
                </p>
              </div>
            )}

            {/* Dream Type Dropdown */}
            <div>
              <Label htmlFor="dreamType" className="mb-2 block">Dream Type</Label>
              <Select value={dreamType} onValueChange={setDreamType}>
                <SelectTrigger id="dreamType">
                  <SelectValue placeholder="Select dream type" />
                </SelectTrigger>
                <SelectContent>
                  {DREAM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dream Description - only show if not "None" */}
            {showDescription && (
              <div>
                <Label htmlFor="dreamDesc">
                  Describe your {DREAM_TYPES.find(t => t.value === dreamType)?.label.toLowerCase()}
                </Label>
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

            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? 'Logging...' : 'Log Dream'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
