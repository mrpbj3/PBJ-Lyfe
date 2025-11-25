// PBJ Health - Dreams Journal Page
import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { DateSelector } from '@/components/DateSelector';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getTodayISO } from '@/lib/dateUtils';

export default function Dreams() {
  const { isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [dreamType, setDreamType] = useState<'dream' | 'nightmare' | 'none'>('none');
  const [narrative, setNarrative] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string; dreamType: string; dreamDesc?: string }) => {
      await apiRequest('POST', '/api/daily-summary', data);
    },
    onSuccess: () => {
      toast({ title: 'Dream logged successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/7d'] });
      setNarrative('');
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
      dreamDesc: narrative.trim() || undefined
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
        <h1 className="text-3xl font-bold mb-8">Dream Journal</h1>
        <DashboardCard title="Log Last Night's Dream">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Label>Did you have any dreams?</Label>
              <RadioGroup
                value={dreamType}
                onValueChange={(value) => setDreamType(value as any)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dream" id="dream" data-testid="radio-dream" />
                  <Label htmlFor="dream">Dream</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nightmare" id="nightmare" data-testid="radio-nightmare" />
                  <Label htmlFor="nightmare">Nightmare</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="no-dream" data-testid="radio-no-dream" />
                  <Label htmlFor="no-dream">None / Don't remember</Label>
                </div>
              </RadioGroup>
            </div>

            {dreamType !== 'none' && (
              <div>
                <Label htmlFor="narrative">Dream Details (optional)</Label>
                <Textarea
                  id="narrative"
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder="Describe what happened in your dream..."
                  rows={6}
                  data-testid="input-dream-narrative"
                />
              </div>
            )}

            <Button type="submit" disabled={mutation.isPending} data-testid="button-log-dream">
              {mutation.isPending ? 'Logging...' : 'Log Dream'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
