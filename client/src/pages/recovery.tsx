// PBJ Health - Recovery & Substances Page
import { useState, useMemo } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getTodayISO } from '@/lib/dateUtils';
import { apiClient } from '@/lib/apiClient';

interface DrugProfile {
  id: string;
  name: string;
  in_recovery: boolean;
  clean_since: string | null;
}

interface WithdrawalNote {
  id: string;
  date: string;
  drug_name: string;
  symptoms: string;
}

export default function Recovery() {
  const { isAuthenticated, user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [selectedDrug, setSelectedDrug] = useState<string>('');
  const [withdrawalNotes, setWithdrawalNotes] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's drug profiles (drugs they're in recovery from)
  const { data: drugProfiles } = useQuery<DrugProfile[]>({
    queryKey: ['drug-profiles', user?.id],
    queryFn: () => apiClient('/api/recovery/drug-profiles'),
    enabled: isAuthenticated,
  });

  // Fetch withdrawal notes history
  const { data: withdrawalHistory } = useQuery<WithdrawalNote[]>({
    queryKey: ['withdrawal-notes', user?.id],
    queryFn: () => apiClient('/api/recovery/withdrawal-notes'),
    enabled: isAuthenticated,
  });

  // Filter to only drugs user is in recovery from
  const recoveryDrugs = useMemo(() => {
    return drugProfiles?.filter(d => d.in_recovery) || [];
  }, [drugProfiles]);

  // Calculate days clean for each drug
  const daysClean = useMemo(() => {
    const result: Record<string, number> = {};
    recoveryDrugs.forEach(drug => {
      if (drug.clean_since) {
        const cleanDate = new Date(drug.clean_since);
        const today = new Date();
        const diffTime = today.getTime() - cleanDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        result[drug.id] = diffDays;
      } else {
        result[drug.id] = 0;
      }
    });
    return result;
  }, [recoveryDrugs]);

  // Submit withdrawal notes
  const withdrawalMutation = useMutation({
    mutationFn: async (data: { date: string; drugName: string; symptoms: string }) => {
      await apiRequest('POST', '/api/recovery/withdrawal', data);
    },
    onSuccess: () => {
      toast({ 
        title: 'Withdrawal notes saved!',
        className: 'bg-green-500 text-white border-green-600'
      });
      queryClient.invalidateQueries({ queryKey: ['withdrawal-notes'] });
      setWithdrawalNotes('');
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

  // Handle relapse
  const relapseMutation = useMutation({
    mutationFn: async (drugId: string) => {
      await apiRequest('POST', '/api/recovery/relapse', { drugId, date: getTodayISO() });
    },
    onSuccess: () => {
      toast({ 
        title: 'Stay strong. Your journey continues.',
        description: 'Your clean date has been reset to today.',
        className: 'bg-yellow-500 text-white border-yellow-600'
      });
      queryClient.invalidateQueries({ queryKey: ['drug-profiles'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive'
      });
    },
  });

  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrug || !withdrawalNotes.trim()) {
      toast({ title: 'Error', description: 'Please select a drug and enter notes', variant: 'destructive' });
      return;
    }
    withdrawalMutation.mutate({ 
      date: selectedDate, 
      drugName: selectedDrug, 
      symptoms: withdrawalNotes 
    });
  };

  const toggleNoteExpanded = (noteId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Today
            </Button>
          </Link>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Recovery & Substances</h1>
        
        {/* Date Picker */}
        <DashboardCard title="Select Date" className="mb-6">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              data-testid="input-recovery-date"
            />
          </div>
        </DashboardCard>

        {/* Your Journey - Recovery Status */}
        <DashboardCard title="Your Journey" className="mb-6">
          {recoveryDrugs.length > 0 ? (
            <div className="space-y-4">
              {recoveryDrugs.map(drug => (
                <div key={drug.id} className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{drug.name}</h3>
                      <p className="text-2xl font-bold text-primary mt-1">
                        {daysClean[drug.id] || 0} days clean
                      </p>
                      {drug.clean_since && (
                        <p className="text-sm text-muted-foreground">
                          Since {new Date(drug.clean_since).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to report a relapse? This will reset your days clean counter.')) {
                          relapseMutation.mutate(drug.id);
                        }
                      }}
                      data-testid={`button-relapse-${drug.id}`}
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Did you relapse?
                    </Button>
                  </div>
                  
                  {/* Previous Progress - Withdrawal Notes */}
                  {withdrawalHistory && withdrawalHistory.filter(n => n.drug_name === drug.name).length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium text-sm mb-2">Previous Progress</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {withdrawalHistory
                          .filter(n => n.drug_name === drug.name)
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map(note => (
                            <div 
                              key={note.id} 
                              className="p-2 bg-background rounded border cursor-pointer"
                              onClick={() => toggleNoteExpanded(note.id)}
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(note.date).toLocaleDateString()}
                                </span>
                                {expandedNotes.has(note.id) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </div>
                              <p className={`text-sm mt-1 ${expandedNotes.has(note.id) ? '' : 'line-clamp-1'}`}>
                                {note.symptoms}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No recovery drugs configured. Add drugs you're recovering from in your profile settings.
            </p>
          )}
        </DashboardCard>

        {/* Withdrawal Symptoms */}
        <DashboardCard title="Withdrawal Symptoms">
          <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
            <div>
              <Label>Drug</Label>
              <Select value={selectedDrug} onValueChange={setSelectedDrug}>
                <SelectTrigger data-testid="select-withdrawal-drug">
                  <SelectValue placeholder="Select drug" />
                </SelectTrigger>
                <SelectContent>
                  {recoveryDrugs.map(drug => (
                    <SelectItem key={drug.id} value={drug.name}>
                      {drug.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={withdrawalNotes}
                onChange={(e) => setWithdrawalNotes(e.target.value)}
                placeholder="Describe your symptoms, cravings, or progress..."
                rows={4}
                data-testid="textarea-withdrawal-notes"
              />
            </div>
            <Button type="submit" disabled={withdrawalMutation.isPending} data-testid="button-save-withdrawal">
              {withdrawalMutation.isPending ? 'Saving...' : 'Save Notes'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
