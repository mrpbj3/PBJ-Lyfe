"use client";

// PBJ Health - Recovery Page (Drug Use Tracking)
// Auto-imports recovery items from profile if user has in_recovery = true
import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { DateSelector } from '@/components/DateSelector';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Heart, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

interface RecoveryItem {
  name: string;
  start_date: string;
  prescribed: boolean;
  track_withdrawal: boolean;
}

export default function Page() {
  const { user, isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [drugUseFlag, setDrugUseFlag] = useState(false);
  const [notes, setNotes] = useState('');
  const [withdrawalSymptoms, setWithdrawalSymptoms] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's profile to check if in_recovery and get recovery_items
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient('/api/profile'),
    enabled: isAuthenticated,
  });

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
    if (existingData?.recovery_notes) {
      setNotes(existingData.recovery_notes);
    } else {
      setNotes('');
    }
  }, [existingData, selectedDate]);

  const mutation = useMutation({
    mutationFn: async (data: { date: string; drugUseFlag: boolean; recoveryNotes?: string }) => {
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
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine all withdrawal symptoms into notes
    const symptomNotes = Object.entries(withdrawalSymptoms)
      .filter(([_, val]) => val.trim())
      .map(([drug, symptoms]) => `${drug}: ${symptoms}`)
      .join('\n');
    
    const combinedNotes = [notes, symptomNotes].filter(Boolean).join('\n\n');
    
    mutation.mutate({ 
      date: selectedDate, 
      drugUseFlag,
      recoveryNotes: combinedNotes || undefined,
    });
  };

  // Calculate days in recovery for each item
  const getDaysInRecovery = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!isAuthenticated) return null;

  const inRecovery = profile?.in_recovery === true;
  const recoveryItems: RecoveryItem[] = profile?.recovery_items || [];

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

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="h-8 w-8" />
          Recovery Tracking
        </h1>

        {/* Show message if not in recovery mode */}
        {!inRecovery && (
          <DashboardCard title="Recovery Mode Not Enabled">
            <div className="flex items-start gap-3 text-muted-foreground">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p>You haven't enabled recovery tracking in your profile.</p>
                <p className="mt-2">
                  To track your recovery journey, go to{' '}
                  <Link href="/profile-detailed" className="text-primary underline">
                    Profile Settings
                  </Link>{' '}
                  and enable "In Recovery" mode.
                </p>
              </div>
            </div>
          </DashboardCard>
        )}

        {/* Recovery Items from Profile */}
        {inRecovery && recoveryItems.length > 0 && (
          <DashboardCard title="Your Recovery Journey">
            <div className="space-y-4">
              {recoveryItems.map((item, index) => (
                <div 
                  key={index} 
                  className="p-4 border rounded-lg bg-accent/30"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Started: {new Date(item.start_date).toLocaleDateString()}
                        {item.prescribed && ' • Prescribed'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {getDaysInRecovery(item.start_date)}
                      </p>
                      <p className="text-xs text-muted-foreground">days clean</p>
                    </div>
                  </div>
                  
                  {item.track_withdrawal && (
                    <div className="mt-3">
                      <Label htmlFor={`symptoms-${index}`} className="text-sm">
                        Withdrawal symptoms / Progress notes
                      </Label>
                      <Textarea
                        id={`symptoms-${index}`}
                        value={withdrawalSymptoms[item.name] || ''}
                        onChange={(e) => setWithdrawalSymptoms(prev => ({
                          ...prev,
                          [item.name]: e.target.value
                        }))}
                        placeholder="How are you feeling today? Any symptoms or progress to note?"
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DashboardCard>
        )}

        {/* Daily Status Log */}
        <DashboardCard title="Daily Recovery Log">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="drugUse" className="text-base font-medium">
                  Did you use any substances today?
                </Label>
                <p className="text-sm text-muted-foreground">
                  Be honest - this helps track your progress
                </p>
              </div>
              <Switch
                id="drugUse"
                checked={drugUseFlag}
                onCheckedChange={setDrugUseFlag}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">How are you feeling today?</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share your thoughts, challenges, or victories..."
                rows={4}
              />
            </div>
            
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? 'Saving...' : 'Save Recovery Log'}
            </Button>
          </form>
        </DashboardCard>

        {/* Link to set up recovery in profile */}
        {inRecovery && recoveryItems.length === 0 && (
          <DashboardCard title="Set Up Recovery Items">
            <p className="text-muted-foreground mb-4">
              You've enabled recovery mode but haven't added any substances to track yet.
            </p>
            <Link href="/profile-detailed">
              <Button variant="outline">
                Go to Profile Settings
              </Button>
            </Link>
          </DashboardCard>
        )}
      </div>
    </div>
  );
}
