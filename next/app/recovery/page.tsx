"use client";

// PBJ Health - Recovery Page (Drug Use Tracking)
// Features:
// - Auto-imports recovery items from profile if user has in_recovery = true
// - Withdrawal Symptoms section with drug dropdown from user's list
// - "Did you relapse?" button to reset days clean
// - "Your Journey" section showing progress and notes history
import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { DateSelector } from '@/components/DateSelector';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Heart, AlertCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';
import { supabase } from '@/lib/supabase/client';

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

interface RecoveryItem {
  name: string;
  start_date: string;
  prescribed: boolean;
  track_withdrawal: boolean;
}

interface WithdrawalNote {
  id: string;
  drug_name: string;
  notes: string;
  created_at: string;
  summary_date: string;
}

export default function Page() {
  const { user, isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [drugUseFlag, setDrugUseFlag] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedDrug, setSelectedDrug] = useState('');
  const [withdrawalNotes, setWithdrawalNotes] = useState('');
  const [expandedJourneys, setExpandedJourneys] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's profile to check if in_recovery and get recovery_items
  const { data: profile, refetch: refetchProfile } = useQuery({
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

  // Fetch withdrawal notes history
  const { data: withdrawalHistory } = useQuery({
    queryKey: ['withdrawal-notes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawal_notes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: isAuthenticated && !!user?.id,
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

  // Save daily recovery log
  const saveMutation = useMutation({
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
      toast({ 
        title: 'Recovery log saved!',
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

  // Save withdrawal notes
  const saveWithdrawalMutation = useMutation({
    mutationFn: async (data: { drugName: string; notes: string; summaryDate: string }) => {
      const { error } = await supabase.from('withdrawal_notes').insert({
        user_id: user?.id,
        drug_name: data.drugName,
        notes: data.notes,
        summary_date: data.summaryDate,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ 
        title: 'Withdrawal notes saved!',
        className: 'bg-green-500 text-white fixed bottom-4 right-4'
      });
      queryClient.invalidateQueries({ queryKey: ['withdrawal-notes'] });
      setWithdrawalNotes('');
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

  // Relapse mutation - resets start_date for a drug
  const relapseMutation = useMutation({
    mutationFn: async (drugName: string) => {
      const updatedItems = recoveryItems.map(item => {
        if (item.name === drugName) {
          return { ...item, start_date: getTodayISO() };
        }
        return item;
      });
      
      const { error } = await supabase
        .from('profiles')
        .update({ recovery_items: updatedItems })
        .eq('id', user?.id);
      
      if (error) throw error;
      return { drugName, previousDays: getDaysInRecovery(recoveryItems.find(i => i.name === drugName)?.start_date || '') };
    },
    onSuccess: (data) => {
      toast({ 
        title: 'Recovery Reset',
        description: `Last clean streak for ${data.drugName}: ${data.previousDays} days. Your new journey starts today.`,
        className: 'fixed bottom-4 right-4'
      });
      refetchProfile();
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
    saveMutation.mutate({ 
      date: selectedDate, 
      drugUseFlag,
      recoveryNotes: notes || undefined,
    });
  };

  const handleSaveWithdrawalNotes = () => {
    if (!selectedDrug || !withdrawalNotes.trim()) {
      toast({ 
        title: 'Error', 
        description: 'Please select a drug and enter notes',
        variant: 'destructive',
        className: 'fixed bottom-4 right-4'
      });
      return;
    }
    saveWithdrawalMutation.mutate({
      drugName: selectedDrug,
      notes: withdrawalNotes,
      summaryDate: selectedDate,
    });
  };

  const handleRelapse = (drugName: string) => {
    if (confirm(`Are you sure you want to mark a relapse for ${drugName}? This will reset your days clean counter.`)) {
      relapseMutation.mutate(drugName);
    }
  };

  // Calculate days in recovery for each item
  const getDaysInRecovery = (startDate: string) => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const toggleJourneyExpand = (drugName: string) => {
    setExpandedJourneys(prev => ({
      ...prev,
      [drugName]: !prev[drugName]
    }));
  };

  if (!isAuthenticated) return null;

  const inRecovery = profile?.in_recovery === true;
  const recoveryItems: RecoveryItem[] = profile?.recovery_items || [];

  // Get notes for a specific drug
  const getNotesForDrug = (drugName: string): WithdrawalNote[] => {
    return (withdrawalHistory || []).filter((n: WithdrawalNote) => n.drug_name === drugName);
  };

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

        {/* Your Journey Section - Show recovery items with days clean */}
        {inRecovery && recoveryItems.length > 0 && (
          <DashboardCard title="Your Journey">
            <div className="space-y-4">
              {recoveryItems.map((item, index) => {
                const daysClean = getDaysInRecovery(item.start_date);
                const drugNotes = getNotesForDrug(item.name);
                const isExpanded = expandedJourneys[item.name];
                
                return (
                  <div 
                    key={index} 
                    className="p-4 border rounded-lg bg-gradient-to-r from-accent/30 to-background"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Started: {new Date(item.start_date).toLocaleDateString()}
                          {item.prescribed && ' • Prescribed'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">
                          {daysClean}
                        </p>
                        <p className="text-xs text-muted-foreground">days clean</p>
                      </div>
                    </div>

                    {/* Relapse Button */}
                    <div className="flex gap-2 mb-3">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRelapse(item.name)}
                        disabled={relapseMutation.isPending}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Did you relapse?
                      </Button>
                    </div>
                    
                    {/* Previous Progress - Expandable */}
                    {drugNotes.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <button
                          onClick={() => toggleJourneyExpand(item.name)}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground w-full"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          Previous Progress ({drugNotes.length} notes)
                        </button>
                        
                        {isExpanded && (
                          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                            {drugNotes.map((note: WithdrawalNote) => (
                              <div key={note.id} className="p-2 bg-muted/50 rounded text-sm">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                  <span>{new Date(note.summary_date).toLocaleDateString()}</span>
                                  <span>{new Date(note.created_at).toLocaleTimeString()}</span>
                                </div>
                                <p>{note.notes}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </DashboardCard>
        )}

        {/* Withdrawal Symptoms Section */}
        {inRecovery && recoveryItems.length > 0 && (
          <DashboardCard title="Log Withdrawal Symptoms">
            <div className="space-y-4">
              <div>
                <Label htmlFor="withdrawalDrug">Select Substance</Label>
                <Select value={selectedDrug} onValueChange={setSelectedDrug}>
                  <SelectTrigger id="withdrawalDrug">
                    <SelectValue placeholder="Select from your recovery list" />
                  </SelectTrigger>
                  <SelectContent>
                    {recoveryItems.filter(i => i.track_withdrawal).map((item) => (
                      <SelectItem key={item.name} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="withdrawalNotes">Symptoms / Progress Notes</Label>
                <Textarea
                  id="withdrawalNotes"
                  value={withdrawalNotes}
                  onChange={(e) => setWithdrawalNotes(e.target.value)}
                  placeholder="How are you feeling? Any symptoms or progress to note?"
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleSaveWithdrawalNotes}
                disabled={saveWithdrawalMutation.isPending || !selectedDrug || !withdrawalNotes.trim()}
                className="w-full"
              >
                {saveWithdrawalMutation.isPending ? 'Saving...' : 'Save Withdrawal Notes'}
              </Button>
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
            
            <Button type="submit" disabled={saveMutation.isPending} className="w-full">
              {saveMutation.isPending ? 'Saving...' : 'Save Recovery Log'}
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
