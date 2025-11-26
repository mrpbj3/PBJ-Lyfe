"use client";

import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Camera } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getTodayISO } from '@/lib/dateUtils';

export default function WeightPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [weightValue, setWeightValue] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('lbs');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string; weightKg: number }) => {
      await apiRequest('POST', '/api/weight', data);
    },
    onSuccess: () => {
      toast({ 
        title: 'Weight logged successfully!',
        className: 'bg-green-500 text-white border-green-600'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/weight'] });
      setWeightValue('');
      setUploadedImage(null);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Process with OCR
    setIsProcessingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/ocr/weight', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('OCR processing failed');
      }

      const result = await response.json();
      if (result.weight) {
        // Autofill the detected weight
        setWeightValue(result.weight.toString());
        setWeightUnit(result.unit || 'lbs');
        toast({
          title: 'Weight detected!',
          description: `Detected ${result.weight} ${result.unit || 'lbs'} from image. You can edit if needed.`,
        });
      } else {
        toast({
          title: 'Could not detect weight',
          description: 'Please enter the weight manually.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast({
        title: 'Image processing failed',
        description: 'Please enter your weight manually.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = parseFloat(weightValue);
    if (isNaN(weight) || weight <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid weight', variant: 'destructive' });
      return;
    }
    
    // Convert to kg if needed
    const weightKg = weightUnit === 'lbs' ? weight * 0.453592 : weight;
    mutation.mutate({ date: selectedDate, weightKg });
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
        <h1 className="text-3xl font-bold mb-8">Log Weight</h1>
        
        {/* Date Picker */}
        <DashboardCard title="Select Date" className="mb-6">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              data-testid="input-weight-date"
            />
          </div>
        </DashboardCard>

        {/* Image Upload */}
        <DashboardCard title="Upload Scale Photo" className="mb-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Take a photo of your scale and we'll try to read the weight automatically.
            </p>
            
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  {uploadedImage ? (
                    <img 
                      src={uploadedImage} 
                      alt="Scale" 
                      className="h-full object-contain rounded"
                    />
                  ) : (
                    <div className="text-center">
                      {isProcessingImage ? (
                        <div className="animate-pulse">Processing...</div>
                      ) : (
                        <>
                          <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
                          <span className="text-sm text-muted-foreground mt-2 block">
                            Click to upload photo
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                  data-testid="input-weight-image"
                />
              </label>
            </div>
            
            {uploadedImage && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setUploadedImage(null);
                  setWeightValue('');
                }}
              >
                Clear Image
              </Button>
            )}
          </div>
        </DashboardCard>

        {/* Manual Entry */}
        <DashboardCard title="Enter Weight">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={weightValue}
                  onChange={(e) => setWeightValue(e.target.value)}
                  placeholder="Enter weight"
                  data-testid="input-weight"
                />
              </div>
              <div>
                <Label htmlFor="unit">Unit</Label>
                <select
                  id="unit"
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value as 'kg' | 'lbs')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  data-testid="select-weight-unit"
                >
                  <option value="lbs">lbs</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-log-weight">
              {mutation.isPending ? 'Logging...' : 'Log Weight'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
