// PBJ Health - Dreams Journal Page
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getTodayISO } from '@/lib/dateUtils';

export default function Dreams() {
  const { isAuthenticated } = useAuth();
  const [title, setTitle] = useState('');
  const [narrative, setNarrative] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string; title: string; narrative: string }) => {
      await apiRequest('POST', '/api/dreams', data);
    },
    onSuccess: () => {
      toast({ title: 'Dream logged successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/dreams'] });
      setTitle('');
      setNarrative('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !narrative) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    mutation.mutate({ date: getTodayISO(), title, narrative });
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
        <h1 className="text-3xl font-bold mb-8">Dream Journal</h1>
        <DashboardCard title="Log Last Night's Dream">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What was your dream about?"
                data-testid="input-dream-title"
              />
            </div>
            <div>
              <Label htmlFor="narrative">Dream Details</Label>
              <Textarea
                id="narrative"
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder="Describe what happened in your dream..."
                rows={6}
                data-testid="input-dream-narrative"
              />
            </div>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-log-dream">
              {mutation.isPending ? 'Logging...' : 'Log Dream'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
