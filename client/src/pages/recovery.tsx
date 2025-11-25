// PBJ Health - Recovery & Substances Page
import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { DateSelector } from '@/components/DateSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Link } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getYesterdayISO } from '@/lib/dateUtils';

interface DrugEntry {
  drugName: string;
  amount: string;
  isPrescribed: boolean;
}

export default function Recovery() {
  const { isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getYesterdayISO());
  const [didUseDrugs, setDidUseDrugs] = useState(false);
  const [drugEntries, setDrugEntries] = useState<DrugEntry[]>([
    { drugName: '', amount: '', isPrescribed: false }
  ]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string; drugUseFlag: boolean }) => {
      await apiRequest('POST', '/api/daily-summary', data);
    },
    onSuccess: () => {
      toast({ title: 'Recovery log saved!' });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/7d'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      date: selectedDate,
      drugUseFlag: didUseDrugs,
    });
  };

  const addDrugEntry = () => {
    setDrugEntries([...drugEntries, { drugName: '', amount: '', isPrescribed: false }]);
  };

  const removeDrugEntry = (index: number) => {
    if (drugEntries.length > 1) {
      setDrugEntries(drugEntries.filter((_, i) => i !== index));
    }
  };

  const updateDrugEntry = (index: number, field: keyof DrugEntry, value: string | boolean) => {
    const updated = [...drugEntries];
    updated[index] = { ...updated[index], [field]: value };
    setDrugEntries(updated);
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
        <h1 className="text-3xl font-bold mb-8">Recovery & Substances</h1>
        
        <DashboardCard title="Track Your Recovery">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Did you use any drugs? */}
            <div className="space-y-2">
              <Label>Did you consume any substances?</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={didUseDrugs ? 'default' : 'outline'}
                  onClick={() => setDidUseDrugs(true)}
                  data-testid="button-drugs-yes"
                  className="flex-1"
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={!didUseDrugs ? 'default' : 'outline'}
                  onClick={() => setDidUseDrugs(false)}
                  data-testid="button-drugs-no"
                  className="flex-1"
                >
                  No
                </Button>
              </div>
            </div>

            {/* Drug entries (if yes) */}
            {didUseDrugs && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                <h4 className="font-medium text-sm">Substance Details</h4>
                {drugEntries.map((entry, idx) => (
                  <div key={idx} className="space-y-3 p-3 bg-background rounded border">
                    <div className="space-y-2">
                      <Label>Substance Name</Label>
                      <Input
                        placeholder="e.g., Alcohol, Cannabis"
                        value={entry.drugName}
                        onChange={(e) => updateDrugEntry(idx, 'drugName', e.target.value)}
                        data-testid={`input-drug-name-${idx}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input
                        placeholder="e.g., 2 beers, 1 joint"
                        value={entry.amount}
                        onChange={(e) => updateDrugEntry(idx, 'amount', e.target.value)}
                        data-testid={`input-drug-amount-${idx}`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={entry.isPrescribed}
                        onChange={(e) => updateDrugEntry(idx, 'isPrescribed', e.target.checked)}
                        data-testid={`checkbox-prescribed-${idx}`}
                        className="h-4 w-4"
                      />
                      <Label>Prescribed medication</Label>
                      {drugEntries.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDrugEntry(idx)}
                          data-testid={`button-remove-drug-${idx}`}
                          className="ml-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDrugEntry}
                  data-testid="button-add-drug"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Another
                </Button>
              </div>
            )}

            <Button type="submit" disabled={mutation.isPending} data-testid="button-log-recovery">
              {mutation.isPending ? 'Saving...' : 'Save Recovery Log'}
            </Button>
          </form>
        </DashboardCard>

        <DashboardCard title="Tips for Recovery" className="mt-6">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Track daily to build awareness of patterns</li>
            <li>• Note triggers and how you handled them</li>
            <li>• Celebrate small victories</li>
            <li>• Reach out to support when needed</li>
          </ul>
        </DashboardCard>
      </div>
    </div>
  );
}
