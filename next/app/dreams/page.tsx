"use client";

import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getTodayISO } from '@/lib/dateUtils';

export default function DreamsPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [dreamType, setDreamType] = useState<string>('none');
  const [description, setDescription] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string; dreamType: string; description: string }) => {
      await apiRequest('POST', '/api/dreams', data);
    },
    onSuccess: () => {
      toast({ 
        title: 'Dream logged successfully!',
        className: 'bg-green-500 text-white border-green-600'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dreams'] });
      setDreamType('none');
      setDescription('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-fill "No Memory" if dream/nightmare selected but description is blank
    let finalDescription = description.trim();
    if ((dreamType === 'dream' || dreamType === 'nightmare') && !finalDescription) {
      finalDescription = 'No Memory';
    }
    
    mutation.mutate({ 
      date: selectedDate, 
      dreamType, 
      description: finalDescription 
    });
  };

  if (!user) return null;

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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dream Journal</h1>
        
        {/* Date Picker */}
        <DashboardCard title="Select Date" className="mb-6">
          <div>
            <Label htmlFor="date">Date of Dream</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              data-testid="input-dream-date"
            />
          </div>
        </DashboardCard>

        <DashboardCard title="Log Dream">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dream Type - Radio Buttons */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Did you have any dreams?</Label>
              <RadioGroup
                value={dreamType}
                onValueChange={setDreamType}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none" className="cursor-pointer">None</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dream" id="dream" />
                  <Label htmlFor="dream" className="cursor-pointer">Dream</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nightmare" id="nightmare" />
                  <Label htmlFor="nightmare" className="cursor-pointer">Nightmare</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Description - Only shown for Dream or Nightmare */}
            {(dreamType === 'dream' || dreamType === 'nightmare') && (
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened in your dream..."
                  rows={6}
                  data-testid="input-dream-description"
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to auto-fill "No Memory"
                </p>
              </div>
            )}

            <Button type="submit" disabled={mutation.isPending} className="w-full" data-testid="button-log-dream">
              {mutation.isPending ? 'Logging...' : 'Log Dream'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
