"use client";

// PBJ Health - Weight Logging Page
// Includes: manual input + image upload with OCR for scale photo
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { DateSelector } from '@/components/DateSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Scale, Upload, Camera } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export default function Page() {
  const { user, isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [weightKg, setWeightKg] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user profile for weight units
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient('/api/profile'),
    enabled: isAuthenticated,
  });

  // Fetch existing weight for selected date
  const { data: existingData } = useQuery({
    queryKey: ['/api/daily-summary', selectedDate],
    queryFn: () => apiClient(`/api/daily-summary/${selectedDate}`),
    enabled: isAuthenticated,
  });

  // Update input when date changes and we have existing data
  useEffect(() => {
    if (existingData?.weight_kg) {
      setWeightKg(existingData.weight_kg.toString());
    } else {
      setWeightKg('');
    }
  }, [existingData, selectedDate]);

  const mutation = useMutation({
    mutationFn: async (data: { date: string; weightKg: number }) => {
      const response = await fetch('/api/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save weight');
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: 'Weight logged successfully!',
        className: 'bg-green-500 text-white fixed bottom-4 right-4'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/7d'] });
      queryClient.invalidateQueries({ queryKey: ['latest-weight'] });
      setUploadedImage(null);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      // Send image to OCR endpoint
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/ocr/weight', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.weight) {
          // If weight is in lbs and user uses lbs, convert to kg for storage
          const weightValue = data.weight;
          const isLbs = profile?.units_weight === 'lb';
          const kgValue = isLbs ? weightValue * 0.453592 : weightValue;
          setWeightKg(kgValue.toFixed(1));
          toast({ 
            title: 'Weight detected!', 
            description: `Detected ${weightValue} ${isLbs ? 'lbs' : 'kg'}. You can edit if needed.` 
          });
        } else {
          toast({ 
            title: 'Could not detect weight', 
            description: 'Please enter manually', 
            variant: 'destructive' 
          });
        }
      } else {
        toast({ 
          title: 'OCR failed', 
          description: 'Please enter weight manually', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast({ 
        title: 'Error processing image', 
        description: 'Please enter weight manually', 
        variant: 'destructive' 
      });
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = parseFloat(weightKg);
    if (isNaN(weight) || weight <= 0) {
      toast({ 
        title: 'Error', 
        description: 'Please enter a valid weight', 
        variant: 'destructive',
        className: 'fixed bottom-4 right-4'
      });
      return;
    }
    mutation.mutate({ date: selectedDate, weightKg: weight });
  };

  if (!isAuthenticated) return null;

  const weightUnit = profile?.units_weight || 'kg';
  const displayWeight = weightKg ? (
    weightUnit === 'lb' 
      ? (parseFloat(weightKg) * 2.20462).toFixed(1) 
      : parseFloat(weightKg).toFixed(1)
  ) : '';

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
          <Scale className="h-8 w-8" />
          Log Weight
        </h1>

        {/* Image Upload Section */}
        <DashboardCard title="Upload Scale Photo">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Take a photo of your scale and we'll try to read the weight automatically.
            </p>
            
            {/* Separate inputs for camera and file upload */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={cameraInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
            <input
              type="file"
              accept="image/*"
              ref={uploadInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessingImage}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => uploadInputRef.current?.click()}
                disabled={isProcessingImage}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
            </div>

            {isProcessingImage && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Processing image...</p>
              </div>
            )}

            {uploadedImage && !isProcessingImage && (
              <div className="mt-4">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded scale" 
                  className="max-h-48 mx-auto rounded-lg border"
                />
              </div>
            )}
          </div>
        </DashboardCard>

        {/* Manual Input Section */}
        <DashboardCard title="Enter Weight Manually">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="weight">Weight ({weightUnit})</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={displayWeight}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      // Convert to kg for storage if user uses lbs
                      const kgVal = weightUnit === 'lb' ? val * 0.453592 : val;
                      setWeightKg(kgVal.toString());
                    } else {
                      setWeightKg('');
                    }
                  }}
                  placeholder={`Enter weight in ${weightUnit}`}
                  data-testid="input-weight"
                />
                <span className="text-muted-foreground">{weightUnit}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {weightUnit === 'lb' && weightKg && (
                  <>Storing as {parseFloat(weightKg).toFixed(1)} kg</>
                )}
              </p>
            </div>
            <Button type="submit" disabled={mutation.isPending} className="w-full" data-testid="button-log-weight">
              {mutation.isPending ? 'Logging...' : 'Log Weight'}
            </Button>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
}
