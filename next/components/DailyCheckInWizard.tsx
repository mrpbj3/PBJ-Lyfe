// PBJ Health - Daily Check-In Wizard
// Guided morning/afternoon flow for logging all daily health metrics
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Brain,
  Moon,
  Dumbbell,
  Scale,
  Wind,
  Heart,
  Home,
  Coffee,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import { getTodayISO, getYesterdayISO } from '@/lib/dateUtils';

interface DailyCheckInWizardProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userFirstName?: string;
}

// Workout types
interface StrengthExercise {
  exercise: string;
  weight: string;
  reps: string;
}

interface CardioActivity {
  type: string;
  duration: string;
}

interface WorkoutSession {
  startTime: string;
  endTime: string;
  strength: StrengthExercise[];
  cardio: CardioActivity[];
}

// Recovery types
interface DrugEntry {
  drugName: string;
  amount: string;
  isPrescribed: boolean;
}

interface WithdrawalEntry {
  drugName: string;
  symptoms: string;
}

// Form schema for all steps combined
const checkInSchema = z.object({
  // Step 1: Mental
  mentalRating: z.enum(['great', 'ok', 'bad']),
  mentalWhy: z.string().optional(),
  
  // Step 2: Sleep
  sleepStart: z.string().optional(),
  sleepEnd: z.string().optional(),
  dreamType: z.enum(['dream', 'nightmare', 'none']),
  dreamDescription: z.string().optional(),
  
  // Step 3: Workout (managed separately with state)
  didWorkout: z.boolean(),
  workoutDate: z.string().optional(),
  
  // Step 4: Weight (image upload handled separately)
  didWeighIn: z.boolean(),
  weightLbs: z.number().optional(),
  
  // Step 5: Meditation
  didMeditate: z.boolean(),
  meditationMin: z.number().optional(),
  
  // Step 6: Work stress
  workStress: z.enum(['low', 'medium', 'high']).optional(),
  workWhy: z.string().optional(),
  
  // Step 7 & 8: Yesterday's activities
  yesterdayHobby: z.string().optional(),
  hobbyDuration: z.number().optional(),
  yesterdaySocial: z.string().optional(),
  socialDuration: z.number().optional(),
  
  // Step 9: Recovery (managed separately with state)
  didUseDrugs: z.boolean(),
  isInRecovery: z.boolean(),
  
  // Step 10: Calories
  mealsDescription: z.string().optional(),
  caloriesConsumed: z.number().optional(),
  proteinG: z.number().optional(),
  fatG: z.number().optional(),
  carbsG: z.number().optional(),
});

type CheckInFormData = z.infer<typeof checkInSchema>;

export function DailyCheckInWizard({ isOpen, onClose, userId, userFirstName }: DailyCheckInWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [meditationTimeLeft, setMeditationTimeLeft] = useState(300); // 5 minutes
  const [isMeditating, setIsMeditating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Workout sessions state
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([
    {
      startTime: '',
      endTime: '',
      strength: [{ exercise: '', weight: '', reps: '' }],
      cardio: [{ type: '', duration: '' }],
    },
  ]);
  
  // Drug tracking state
  const [drugEntries, setDrugEntries] = useState<DrugEntry[]>([
    { drugName: '', amount: '', isPrescribed: false },
  ]);
  
  // Withdrawal tracking state
  const [withdrawalEntries, setWithdrawalEntries] = useState<WithdrawalEntry[]>([
    { drugName: '', symptoms: '' },
  ]);
  
  // Calorie calculation state
  const [isCalculatingCalories, setIsCalculatingCalories] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = getTodayISO();
  const yesterday = getYesterdayISO();

  // Get user profile to check if inRecovery and get calorie goal
  const { data: profile } = useQuery<{ inRecovery?: boolean }>({
    queryKey: ['/api/profile'],
    enabled: isOpen,
  });
  
  const { data: goals } = useQuery<{ kcalGoal?: number }>({
    queryKey: ['/api/goals'],
    enabled: isOpen,
  });

  const totalSteps = 11; // Now includes Work (6), Calories (10) and Summary (11)
  const greeting = new Date().getHours() < 12 ? 'Good Morning' : 'Good Afternoon';

  const form = useForm<CheckInFormData>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      mentalRating: 'ok',
      sleepStart: '',
      sleepEnd: '',
      dreamType: 'none',
      dreamDescription: 'N/A',
      didWorkout: false,
      didWeighIn: false,
      didMeditate: false,
      workStress: undefined,
      workWhy: '',
      didUseDrugs: false,
      isInRecovery: false,
      mealsDescription: '',
      caloriesConsumed: undefined,
      proteinG: undefined,
      fatG: undefined,
      carbsG: undefined,
    },
  });

  // Watch form values for conditional logic
  const dreamType = form.watch('dreamType');
  const didWorkout = form.watch('didWorkout');
  const didWeighIn = form.watch('didWeighIn');
  const didMeditate = form.watch('didMeditate');
  const didUseDrugs = form.watch('didUseDrugs');
  const isInRecovery = form.watch('isInRecovery');
  const mealsDescription = form.watch('mealsDescription');
  const caloriesConsumed = form.watch('caloriesConsumed');
  
  // Auto-set isInRecovery from profile
  useEffect(() => {
    if (profile?.inRecovery && !form.getValues('isInRecovery')) {
      form.setValue('isInRecovery', true);
    }
  }, [profile, form]);
  
  // Function to calculate calories using OpenAI
  const calculateCalories = async () => {
    if (!mealsDescription || mealsDescription.trim() === '') {
      toast({
        title: 'No meal description',
        description: 'Please describe what you ate/drank yesterday',
        variant: 'destructive',
      });
      return;
    }
    
    setIsCalculatingCalories(true);
    try {
      const response = await apiRequest('POST', '/api/calculate-calories', {
        mealsDescription: mealsDescription,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API error:', errorData);
        throw new Error(errorData.message || 'Failed to calculate calories');
      }
      
      const data = await response.json();
      
      console.log('AI calorie calculation response:', data);
      
      // Validate that all values exist and are valid numbers (allow 0 values)
      if (data.calories == null || data.protein == null || data.fat == null || data.carbs == null ||
          isNaN(data.calories) || isNaN(data.protein) || isNaN(data.fat) || isNaN(data.carbs)) {
        console.error('Invalid nutrition data:', data);
        throw new Error('Invalid response from AI — missing or invalid nutritional data. Please enter manually.');
      }
      
      form.setValue('caloriesConsumed', Math.round(data.calories));
      form.setValue('proteinG', Math.round(data.protein));
      form.setValue('fatG', Math.round(data.fat));
      form.setValue('carbsG', Math.round(data.carbs));
      setHasCalculated(true);
      
      toast({
        title: 'Calories Calculated',
        description: `Estimated ${data.calories} calories from your meals`,
      });
    } catch (error) {
      console.error('Error calculating calories:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Calculation Failed',
        description: `Could not calculate calories: ${errorMessage}. Please enter manually.`,
        variant: 'destructive',
      });
    } finally {
      setIsCalculatingCalories(false);
    }
  };

  // Auto-fill dream description
  useEffect(() => {
    if (dreamType === 'none') {
      form.setValue('dreamDescription', 'N/A');
    } else if (!form.getValues('dreamDescription') || form.getValues('dreamDescription') === 'N/A') {
      form.setValue('dreamDescription', '');
    }
  }, [dreamType, form]);

  // Meditation timer
  useEffect(() => {
    if (isMeditating && meditationTimeLeft > 0) {
      const timer = setTimeout(() => setMeditationTimeLeft(meditationTimeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (meditationTimeLeft === 0) {
      setIsMeditating(false);
      toast({
        title: 'Meditation Complete',
        description: '5 minutes of mindfulness completed!',
      });
      form.setValue('meditationMin', 5);
      setCurrentStep(currentStep + 1);
    }
  }, [isMeditating, meditationTimeLeft, currentStep, form, toast]);

  // Submit all data
  const submitCheckIn = useMutation({
    mutationFn: async (data: CheckInFormData) => {
      const errors: string[] = [];
      
      // Submit mental health
      try {
        await apiRequest('POST', '/api/mental', {
          date: today,
          rating: data.mentalRating,
          why: data.mentalWhy,
        });
      } catch (e) {
        console.error('Mental API error:', e);
        errors.push('mental');
      }

      // Submit sleep
      try {
        if (data.sleepStart && data.sleepEnd) {
          await apiRequest('POST', '/api/sleep', {
            startAt: data.sleepStart,
            endAt: data.sleepEnd,
            dreamType: data.dreamType,
            dreamDescription: data.dreamDescription || (data.dreamType === 'none' ? 'N/A' : 'No Memory'),
          });
        }
      } catch (e) {
        console.error('Sleep API error:', e);
        errors.push('sleep');
      }

      // Submit workout sessions if applicable
      if (data.didWorkout && data.workoutDate) {
        try {
          for (const session of workoutSessions) {
            // Only submit sessions with at least start/end time
            if (session.startTime && session.endTime) {
              // Combine date with times for full datetime
              const startAt = `${data.workoutDate}T${session.startTime}`;
              const endAt = `${data.workoutDate}T${session.endTime}`;
              
              // Collect all non-empty strength exercises
              const exercises = session.strength
                .filter(ex => ex.exercise.trim())
                .map(ex => `${ex.exercise} - ${ex.weight} x ${ex.reps}`)
                .concat(
                  session.cardio
                    .filter(c => c.type.trim())
                    .map(c => `${c.type} - ${c.duration}`)
                );
              
              await apiRequest('POST', '/api/workouts', {
                date: data.workoutDate,
                startAt: startAt,
                endAt: endAt,
                exercises: exercises,
              });
            }
          }
        } catch (e) {
          console.error('Workout API error:', e);
          errors.push('workout');
        }
      }

      // Submit weight if provided (convert lbs to kg for storage)
      if (data.didWeighIn && data.weightLbs) {
        try {
          const weightKg = data.weightLbs * 0.453592; // Convert lbs to kg
          await apiRequest('POST', '/api/weight', {
            date: today,
            weightKg: weightKg,
          });
        } catch (e) {
          console.error('Weight API error:', e);
          errors.push('weight');
        }
      }

      // Submit meditation if done
      if (data.didMeditate && data.meditationMin) {
        try {
          await apiRequest('POST', '/api/meditation', {
            date: today,
            durationMin: data.meditationMin,
          });
        } catch (e) {
          console.error('Meditation API error:', e);
          errors.push('meditation');
        }
      }

      // Submit yesterday's work stress
      if (data.workStress) {
        try {
          await apiRequest('POST', '/api/work', {
            date: yesterday,
            stress: data.workStress,
            why: data.workWhy,
          });
        } catch (e) {
          console.error('Work API error:', e);
          errors.push('work');
        }
      }

      // Submit yesterday's hobbies
      if (data.yesterdayHobby) {
        try {
          await apiRequest('POST', '/api/hobbies', {
            date: yesterday,
            hobby: data.yesterdayHobby,
            durationMin: data.hobbyDuration || 0,
          });
        } catch (e) {
          console.error('Hobbies API error:', e);
          errors.push('hobbies');
        }
      }

      // Submit yesterday's social
      if (data.yesterdaySocial) {
        try {
          await apiRequest('POST', '/api/social', {
            date: yesterday,
            activity: data.yesterdaySocial,
            durationMin: data.socialDuration || 0,
          });
        } catch (e) {
          console.error('Social API error:', e);
          errors.push('social');
        }
      }
      
      // Submit calories/meals if provided
      if (data.caloriesConsumed) {
        try {
          await apiRequest('POST', '/api/meals', {
            date: yesterday,
            calories: data.caloriesConsumed,
            proteinG: data.proteinG,
            fatG: data.fatG,
            carbsG: data.carbsG,
            notes: data.mealsDescription,
          });
        } catch (e) {
          console.error('Meals API error:', e);
          errors.push('meals');
        }
      }

      // Submit drug use logs if applicable
      if (data.didUseDrugs) {
        try {
          for (const entry of drugEntries) {
            if (entry.drugName.trim()) {
              await apiRequest('POST', '/api/recovery/drug-use', {
                date: yesterday,
                drugName: entry.drugName,
                amount: entry.amount,
                isPrescribed: entry.isPrescribed,
              });
            }
          }
        } catch (e) {
          console.error('Drug use API error:', e);
          errors.push('drug-use');
        }
      }
      
      // Submit withdrawal symptoms if applicable
      if (data.isInRecovery) {
        try {
          for (const entry of withdrawalEntries) {
            if (entry.drugName.trim() && entry.symptoms.trim()) {
              await apiRequest('POST', '/api/recovery/withdrawal', {
                date: yesterday,
                drugName: entry.drugName,
                symptoms: entry.symptoms,
              });
            }
          }
        } catch (e) {
          console.error('Withdrawal API error:', e);
          errors.push('withdrawal');
        }
      }
      
      // Return result - we consider it successful even if some endpoints failed
      // as long as core data was saved
      return { errors };
    },
    onSuccess: async (result) => {
      console.log('Check-in successful, invalidating queries for userId:', userId);
      
      // Invalidate and refetch all relevant queries to refresh data across the app
      // Use exact query keys or partial matching with queryKey predicate
      await Promise.all([
        // Invalidate with exact keys
        queryClient.invalidateQueries({ queryKey: ['/api/analytics/daily'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/streaks/current'] }),
        queryClient.invalidateQueries({ queryKey: ['analytics-daily'] }),
        queryClient.invalidateQueries({ queryKey: ['streak-current'] }),
        // Invalidate all analytics-7d queries (including with userId)
        queryClient.invalidateQueries({ 
          predicate: (query) => query.queryKey[0] === 'analytics-7d'
        }),
        // Invalidate all weight queries (including with "latest" and userId)
        queryClient.invalidateQueries({ 
          predicate: (query) => query.queryKey[0] === 'weight'
        }),
        // Invalidate all profile queries
        queryClient.invalidateQueries({ 
          predicate: (query) => query.queryKey[0] === 'profile'
        }),
      ]);
      
      // Force refetch specific queries to get fresh data immediately
      await Promise.all([
        queryClient.refetchQueries({ 
          predicate: (query) => query.queryKey[0] === 'analytics-7d'
        }),
        queryClient.refetchQueries({ 
          predicate: (query) => query.queryKey[0] === 'weight'
        }),
        queryClient.refetchQueries({ queryKey: ['analytics-daily'] }),
      ]);
      
      console.log('Query cache invalidated and refetched after check-in');
      
      // Show success toast
      toast({
        title: 'Thanks for checking in!',
        className: 'bg-green-500 text-white border-green-600',
      });
      
      // Close the dialog
      onClose();
    },
    onError: (error) => {
      console.error('Check-in submission error:', error);
      toast({
        title: "Sorry, we couldn't check you in right now. Please try again later.",
        variant: 'destructive',
        className: 'bg-red-500 text-white border-red-600',
      });
    },
  });

  const handleNext = async () => {
    // Validate only the current step's fields
    let fieldsToValidate: (keyof CheckInFormData)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['mentalRating', 'mentalWhy'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['sleepStart', 'sleepEnd', 'dreamType', 'dreamDescription'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['didWorkout', 'workoutDate'];
      
      // Additional validation for workout step
      const didWorkoutValue = form.getValues('didWorkout');
      if (didWorkoutValue) {
        // Validate at least one session has both start and end times
        const hasValidSession = workoutSessions.some(
          session => session.startTime && session.endTime
        );
        
        if (!hasValidSession) {
          toast({
            title: 'Missing session times',
            description: 'Please fill in start and end times for at least one session',
            variant: 'destructive',
          });
          return;
        }
      }
    } else if (currentStep === 4) {
      fieldsToValidate = ['didWeighIn'];
      
      // Additional validation for weight step - only require weight if user weighed in
      const didWeighInValue = form.getValues('didWeighIn');
      if (didWeighInValue) {
        const weightLbs = form.getValues('weightLbs');
        if (!weightLbs || weightLbs <= 0) {
          toast({
            title: 'Missing weight',
            description: 'Please enter your weight in pounds',
            variant: 'destructive',
          });
          return;
        }
      }
    } else if (currentStep === 5) {
      fieldsToValidate = ['didMeditate'];
    } else if (currentStep === 6) {
      // Step 6 (work) - optional, no required validation
      fieldsToValidate = [];
    } else if (currentStep === 7) {
      // Step 7 (hobbies) - optional, no required validation
      fieldsToValidate = [];
    } else if (currentStep === 8) {
      // Step 8 (social) - optional, no required validation
      fieldsToValidate = [];
    } else if (currentStep === 9) {
      // Step 9 (recovery) - optional, no required validation
      fieldsToValidate = [];
    } else if (currentStep === 10) {
      // Step 10 (meals/calories) - optional, no required validation
      fieldsToValidate = [];
    } else if (currentStep === 11) {
      // Step 11 (summary) - no validation needed, just submit
      fieldsToValidate = [];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (!isValid) {
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - submit everything directly
      const data = form.getValues();
      submitCheckIn.mutate(data);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {greeting}, How's Lyfe?
          </DialogTitle>
          <DialogDescription>
            Complete your daily check-in to track yesterday's health journey
          </DialogDescription>
          <Progress value={(currentStep / totalSteps) * 100} className="mt-4" />
          <p className="text-sm text-muted-foreground mt-2">
            Step {currentStep} of {totalSteps}
          </p>
        </DialogHeader>

        <form className="space-y-6 mt-6">
          {/* Step 1: Mental Health */}
          {currentStep === 1 && (
            <div className="space-y-4" data-testid="step-mental">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">How would you describe your mental state yesterday?</h3>
              </div>
              
              <div className="space-y-4">
                <Label>Mental state yesterday</Label>
                <RadioGroup
                  value={form.watch('mentalRating')}
                  onValueChange={(value) => form.setValue('mentalRating', value as any)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="great" id="great" data-testid="radio-mental-great" />
                    <Label htmlFor="great">Great</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ok" id="ok" data-testid="radio-mental-ok" />
                    <Label htmlFor="ok">Ok</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bad" id="bad" data-testid="radio-mental-bad" />
                    <Label htmlFor="bad">Bad</Label>
                  </div>
                </RadioGroup>

                <div>
                  <Label htmlFor="mental-why">Why? (optional)</Label>
                  <Textarea
                    id="mental-why"
                    placeholder="Share what's on your mind..."
                    {...form.register('mentalWhy')}
                    data-testid="textarea-mental-why"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Sleep */}
          {currentStep === 2 && (
            <div className="space-y-4" data-testid="step-sleep">
              <div className="flex items-center gap-2 mb-4">
                <Moon className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">How did you sleep last night?</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sleep-start">Went to bed</Label>
                  <Input
                    id="sleep-start"
                    type="datetime-local"
                    {...form.register('sleepStart')}
                    data-testid="input-sleep-start-wizard"
                  />
                </div>
                <div>
                  <Label htmlFor="sleep-end">Woke up</Label>
                  <Input
                    id="sleep-end"
                    type="datetime-local"
                    {...form.register('sleepEnd')}
                    data-testid="input-sleep-end-wizard"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Did you have any dreams?</Label>
                <RadioGroup
                  value={dreamType}
                  onValueChange={(value) => form.setValue('dreamType', value as any)}
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
                    <Label htmlFor="no-dream">None</Label>
                  </div>
                </RadioGroup>

                {dreamType !== 'none' && (
                  <div>
                    <Label htmlFor="dream-description">Description</Label>
                    <Textarea
                      id="dream-description"
                      placeholder="Describe your dream..."
                      {...form.register('dreamDescription')}
                      data-testid="textarea-dream-description"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave blank to auto-fill "No Memory"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Workout */}
          {currentStep === 3 && (
            <div className="space-y-6" data-testid="step-workout">
              <div className="flex items-center gap-2 mb-4">
                <Dumbbell className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">Did you work out yesterday?</h3>
              </div>

              <RadioGroup
                value={didWorkout ? 'yes' : 'no'}
                onValueChange={(value) => form.setValue('didWorkout', value === 'yes')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="workout-yes" data-testid="radio-workout-yes" />
                  <Label htmlFor="workout-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="workout-no" data-testid="radio-workout-no" />
                  <Label htmlFor="workout-no">No</Label>
                </div>
              </RadioGroup>

              {didWorkout && (
                <div className="space-y-6 mt-4">
                  {/* Date field */}
                  <div>
                    <Label htmlFor="workout-date">Date</Label>
                    <Input
                      id="workout-date"
                      type="date"
                      {...form.register('workoutDate')}
                      data-testid="input-workout-date"
                      className={form.formState.errors.workoutDate ? 'border-destructive' : ''}
                    />
                    {form.formState.errors.workoutDate && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.workoutDate.message}
                      </p>
                    )}
                  </div>

                  {/* Workout Sessions */}
                  {workoutSessions.map((session, sessionIdx) => (
                    <div key={sessionIdx} className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-semibold">Session {sessionIdx + 1}</h4>
                      
                      {/* Session Time */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`session-${sessionIdx}-start`}>Start Time</Label>
                          <Input
                            id={`session-${sessionIdx}-start`}
                            type="time"
                            value={session.startTime}
                            onChange={(e) => {
                              const newSessions = [...workoutSessions];
                              newSessions[sessionIdx].startTime = e.target.value;
                              setWorkoutSessions(newSessions);
                            }}
                            data-testid={`input-session-${sessionIdx}-start`}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`session-${sessionIdx}-end`}>End Time</Label>
                          <Input
                            id={`session-${sessionIdx}-end`}
                            type="time"
                            value={session.endTime}
                            onChange={(e) => {
                              const newSessions = [...workoutSessions];
                              newSessions[sessionIdx].endTime = e.target.value;
                              setWorkoutSessions(newSessions);
                            }}
                            data-testid={`input-session-${sessionIdx}-end`}
                          />
                        </div>
                      </div>

                      {/* Workouts - Two Columns */}
                      <div>
                        <Label className="text-base font-semibold mb-2">Workouts</Label>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          {/* Column 1: Strength */}
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm">Strength</h5>
                            {session.strength.map((exercise, exIdx) => (
                              <div key={exIdx} className="flex gap-2 items-start">
                                <div className="flex-1 space-y-1">
                                  <Input
                                    placeholder="Exercise"
                                    value={exercise.exercise}
                                    onChange={(e) => {
                                      const newSessions = [...workoutSessions];
                                      newSessions[sessionIdx].strength[exIdx].exercise = e.target.value;
                                      setWorkoutSessions(newSessions);
                                    }}
                                    data-testid={`input-strength-${sessionIdx}-${exIdx}-exercise`}
                                    className="text-sm"
                                  />
                                  <div className="flex gap-1">
                                    <Input
                                      placeholder="Weight"
                                      value={exercise.weight}
                                      onChange={(e) => {
                                        const newSessions = [...workoutSessions];
                                        newSessions[sessionIdx].strength[exIdx].weight = e.target.value;
                                        setWorkoutSessions(newSessions);
                                      }}
                                      data-testid={`input-strength-${sessionIdx}-${exIdx}-weight`}
                                      className="text-sm"
                                    />
                                    <Input
                                      placeholder="Reps"
                                      value={exercise.reps}
                                      onChange={(e) => {
                                        const newSessions = [...workoutSessions];
                                        newSessions[sessionIdx].strength[exIdx].reps = e.target.value;
                                        setWorkoutSessions(newSessions);
                                      }}
                                      data-testid={`input-strength-${sessionIdx}-${exIdx}-reps`}
                                      className="text-sm"
                                    />
                                  </div>
                                </div>
                                {session.strength.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const newSessions = [...workoutSessions];
                                      newSessions[sessionIdx].strength.splice(exIdx, 1);
                                      setWorkoutSessions(newSessions);
                                    }}
                                    data-testid={`button-remove-strength-${sessionIdx}-${exIdx}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newSessions = [...workoutSessions];
                                newSessions[sessionIdx].strength.push({ exercise: '', weight: '', reps: '' });
                                setWorkoutSessions(newSessions);
                              }}
                              data-testid={`button-add-strength-${sessionIdx}`}
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add Exercise
                            </Button>
                          </div>

                          {/* Column 2: Cardio */}
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm">Cardio</h5>
                            {session.cardio.map((cardio, cardioIdx) => (
                              <div key={cardioIdx} className="flex gap-2 items-center">
                                <Input
                                  placeholder="Type"
                                  value={cardio.type}
                                  onChange={(e) => {
                                    const newSessions = [...workoutSessions];
                                    newSessions[sessionIdx].cardio[cardioIdx].type = e.target.value;
                                    setWorkoutSessions(newSessions);
                                  }}
                                  data-testid={`input-cardio-${sessionIdx}-${cardioIdx}-type`}
                                  className="text-sm flex-1"
                                />
                                <Input
                                  placeholder="Duration"
                                  value={cardio.duration}
                                  onChange={(e) => {
                                    const newSessions = [...workoutSessions];
                                    newSessions[sessionIdx].cardio[cardioIdx].duration = e.target.value;
                                    setWorkoutSessions(newSessions);
                                  }}
                                  data-testid={`input-cardio-${sessionIdx}-${cardioIdx}-duration`}
                                  className="text-sm flex-1"
                                />
                                {session.cardio.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const newSessions = [...workoutSessions];
                                      newSessions[sessionIdx].cardio.splice(cardioIdx, 1);
                                      setWorkoutSessions(newSessions);
                                    }}
                                    data-testid={`button-remove-cardio-${sessionIdx}-${cardioIdx}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newSessions = [...workoutSessions];
                                newSessions[sessionIdx].cardio.push({ type: '', duration: '' });
                                setWorkoutSessions(newSessions);
                              }}
                              data-testid={`button-add-cardio-${sessionIdx}`}
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add Cardio
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Another Session */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Add another session?</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setWorkoutSessions([
                            ...workoutSessions,
                            {
                              startTime: '',
                              endTime: '',
                              strength: [{ exercise: '', weight: '', reps: '' }],
                              cardio: [{ type: '', duration: '' }],
                            },
                          ]);
                        }}
                        data-testid="button-add-session"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Yes, Add Session
                      </Button>
                      {workoutSessions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            const newSessions = [...workoutSessions];
                            newSessions.pop();
                            setWorkoutSessions(newSessions);
                          }}
                          data-testid="button-remove-last-session"
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Remove Last Session
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Weight (with image upload placeholder) */}
          {currentStep === 4 && (
            <div className="space-y-4" data-testid="step-weight">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">Did you weigh in yesterday?</h3>
              </div>

              <RadioGroup
                value={didWeighIn ? 'yes' : 'no'}
                onValueChange={(value) => form.setValue('didWeighIn', value === 'yes')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="weighin-yes" data-testid="radio-weighin-yes" />
                  <Label htmlFor="weighin-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="weighin-no" data-testid="radio-weighin-no" />
                  <Label htmlFor="weighin-no">No</Label>
                </div>
              </RadioGroup>

              {didWeighIn && (
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="weight-upload">Upload Body Metrics Screenshot (optional)</Label>
                    <Input
                      id="weight-upload"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setUploadedImage(reader.result as string);
                            // TODO: Call OpenAI Vision API to analyze image
                            toast({
                              title: 'Image uploaded',
                              description: 'AI analysis will be implemented soon',
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      data-testid="input-weight-image"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Or enter manually below
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="weight-lbs">Weight (lbs)</Label>
                    <Input
                      id="weight-lbs"
                      type="number"
                      step="0.1"
                      placeholder="155.5"
                      {...form.register('weightLbs', { valueAsNumber: true })}
                      data-testid="input-weight-lbs-wizard"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Meditation */}
          {currentStep === 5 && (
            <div className="space-y-4" data-testid="step-meditation">
              <div className="flex items-center gap-2 mb-4">
                <Wind className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">Did you meditate yesterday?</h3>
              </div>

              {!isMeditating ? (
                <>
                  <RadioGroup
                    value={didMeditate ? 'yes' : 'no'}
                    onValueChange={(value) => {
                      const meditated = value === 'yes';
                      form.setValue('didMeditate', meditated);
                      if (meditated) {
                        form.setValue('meditationMin', 5);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="meditate-yes" data-testid="radio-meditate-yes" />
                      <Label htmlFor="meditate-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="meditate-no" data-testid="radio-meditate-no" />
                      <Label htmlFor="meditate-no">No</Label>
                    </div>
                  </RadioGroup>

                  {!didMeditate && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setIsMeditating(true);
                        setMeditationTimeLeft(300);
                      }}
                      data-testid="button-start-meditation"
                    >
                      Start 5-Minute Meditation Timer
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-6xl font-bold text-primary">
                    {formatTime(meditationTimeLeft)}
                  </div>
                  <p className="text-muted-foreground">Breathe deeply and relax...</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsMeditating(false);
                      setMeditationTimeLeft(300);
                    }}
                    data-testid="button-stop-meditation"
                  >
                    Stop Timer
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 6: Work Stress */}
          {currentStep === 6 && (
            <div className="space-y-4" data-testid="step-work">
              <div className="flex items-center gap-2 mb-4">
                <Coffee className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">How was work yesterday?</h3>
              </div>

              <div>
                <Label>Stress Level</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <Button
                    type="button"
                    variant={form.watch('workStress') === 'low' ? 'default' : 'outline'}
                    onClick={() => form.setValue('workStress', 'low')}
                    data-testid="button-work-stress-low"
                  >
                    Low
                  </Button>
                  <Button
                    type="button"
                    variant={form.watch('workStress') === 'medium' ? 'default' : 'outline'}
                    onClick={() => form.setValue('workStress', 'medium')}
                    data-testid="button-work-stress-medium"
                  >
                    Medium
                  </Button>
                  <Button
                    type="button"
                    variant={form.watch('workStress') === 'high' ? 'default' : 'outline'}
                    onClick={() => form.setValue('workStress', 'high')}
                    data-testid="button-work-stress-high"
                  >
                    High
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="work-why">Why? (optional)</Label>
                <Textarea
                  id="work-why"
                  placeholder="What made work stressful or easy yesterday?"
                  {...form.register('workWhy')}
                  rows={3}
                  data-testid="textarea-work-why"
                />
                <p className="text-sm text-destructive font-semibold mt-2" data-testid="text-work-disclaimer">
                  DO NOT SHARE SENSITIVE INFORMATION ABOUT YOUR JOB
                </p>
              </div>
            </div>
          )}

          {/* Step 7: Yesterday's Hobbies */}
          {currentStep === 7 && (
            <div className="space-y-4" data-testid="step-hobbies">
              <div className="flex items-center gap-2 mb-4">
                <Home className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">Did you do any hobbies yesterday?</h3>
              </div>

              <div>
                <Label htmlFor="hobby">Hobby Activity</Label>
                <Input
                  id="hobby"
                  placeholder="Reading, guitar, cooking, gaming..."
                  {...form.register('yesterdayHobby')}
                  data-testid="input-hobby"
                />
              </div>

              <div>
                <Label htmlFor="hobby-duration">Duration (minutes, optional)</Label>
                <Input
                  id="hobby-duration"
                  type="number"
                  placeholder="e.g., 30"
                  {...form.register('hobbyDuration', { valueAsNumber: true })}
                  data-testid="input-hobby-duration"
                />
              </div>
            </div>
          )}

          {/* Step 8: Yesterday's Social */}
          {currentStep === 8 && (
            <div className="space-y-4" data-testid="step-social">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">Did you have any social activities yesterday?</h3>
              </div>

              <div>
                <Label htmlFor="social">Social Activity</Label>
                <Input
                  id="social"
                  placeholder="Dinner with friends, family call, game night..."
                  {...form.register('yesterdaySocial')}
                  data-testid="input-social"
                />
              </div>

              <div>
                <Label htmlFor="social-duration">Duration (minutes, optional)</Label>
                <Input
                  id="social-duration"
                  type="number"
                  placeholder="e.g., 120"
                  {...form.register('socialDuration', { valueAsNumber: true })}
                  data-testid="input-social-duration"
                />
              </div>
            </div>
          )}

          {/* Step 10: Calories */}
          {currentStep === 10 && (
            <div className="space-y-6" data-testid="step-calories">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">What did you eat/drink yesterday?</h3>
              </div>

              <div className="space-y-2">
                <Label>Meals & Beverages</Label>
                <Textarea
                  placeholder="Breakfast: 2 eggs, toast, coffee&#10;Lunch: Chicken salad, water&#10;Dinner: Pasta, wine&#10;Snacks: Apple, protein bar"
                  {...form.register('mealsDescription')}
                  data-testid="textarea-meals"
                  rows={6}
                />
              </div>

              {/* AI Calculate Button */}
              <Button
                type="button"
                variant="outline"
                onClick={calculateCalories}
                disabled={isCalculatingCalories || !mealsDescription}
                data-testid="button-calculate-calories"
                className="w-full"
              >
                {isCalculatingCalories ? 'Calculating...' : 'Calculate with AI'}
              </Button>

              {/* Calorie & Macro Fields */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
                <div className="col-span-2 space-y-2">
                  <Label>Calories Consumed</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 2000"
                    {...form.register('caloriesConsumed', { valueAsNumber: true })}
                    data-testid="input-calories"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Protein (g)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 120"
                    {...form.register('proteinG', { valueAsNumber: true })}
                    data-testid="input-protein"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fat (g)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 60"
                    {...form.register('fatG', { valueAsNumber: true })}
                    data-testid="input-fat"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Carbs (g)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 200"
                    {...form.register('carbsG', { valueAsNumber: true })}
                    data-testid="input-carbs"
                  />
                </div>
              </div>

              {/* Net Calories Info */}
              {caloriesConsumed && goals?.kcalGoal && (
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Calorie Target:</span>
                    <span className="text-sm">{goals.kcalGoal} kcal</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Consumed:</span>
                    <span className="text-sm">{caloriesConsumed} kcal</span>
                  </div>
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-sm">Status:</span>
                    <span className={`text-sm ${caloriesConsumed <= goals.kcalGoal ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {caloriesConsumed <= goals.kcalGoal ? 'Under Target ✓' : 'Over Target'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 9: Recovery */}
          {currentStep === 9 && (
            <div className="space-y-6" data-testid="step-recovery">
              <div className="flex items-center gap-2 mb-4">
                <Coffee className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">Recovery Check-In</h3>
              </div>

              {/* Did you consume drugs yesterday? */}
              <div className="space-y-2">
                <Label>Did you consume any drugs yesterday?</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={didUseDrugs ? 'default' : 'outline'}
                    onClick={() => form.setValue('didUseDrugs', true)}
                    data-testid="button-drugs-yes"
                    className="flex-1"
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={!didUseDrugs ? 'default' : 'outline'}
                    onClick={() => form.setValue('didUseDrugs', false)}
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
                  <h4 className="font-medium text-sm">Drug Details</h4>
                  {drugEntries.map((entry, idx) => (
                    <div key={idx} className="space-y-3 p-3 bg-background rounded border">
                      <div className="space-y-2">
                        <Label>Drug Name</Label>
                        <Input
                          placeholder="e.g., Alcohol, Cannabis"
                          value={entry.drugName}
                          onChange={(e) => {
                            const newEntries = [...drugEntries];
                            newEntries[idx].drugName = e.target.value;
                            setDrugEntries(newEntries);
                          }}
                          data-testid={`input-drug-name-${idx}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                          placeholder="e.g., 2 beers, 1 joint"
                          value={entry.amount}
                          onChange={(e) => {
                            const newEntries = [...drugEntries];
                            newEntries[idx].amount = e.target.value;
                            setDrugEntries(newEntries);
                          }}
                          data-testid={`input-drug-amount-${idx}`}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={entry.isPrescribed}
                          onChange={(e) => {
                            const newEntries = [...drugEntries];
                            newEntries[idx].isPrescribed = e.target.checked;
                            setDrugEntries(newEntries);
                          }}
                          data-testid={`checkbox-prescribed-${idx}`}
                          className="h-4 w-4"
                        />
                        <Label>Prescribed medication</Label>
                        {drugEntries.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newEntries = [...drugEntries];
                              newEntries.splice(idx, 1);
                              setDrugEntries(newEntries);
                            }}
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
                    onClick={() => {
                      setDrugEntries([...drugEntries, { drugName: '', amount: '', isPrescribed: false }]);
                    }}
                    data-testid="button-add-drug"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Another Drug
                  </Button>
                </div>
              )}

              {/* Are you in recovery checkbox */}
              <div className="flex items-center gap-2 p-3 bg-muted/20 rounded border">
                <input
                  type="checkbox"
                  checked={isInRecovery}
                  onChange={(e) => form.setValue('isInRecovery', e.target.checked)}
                  data-testid="checkbox-in-recovery"
                  className="h-4 w-4"
                />
                <Label>I am in recovery</Label>
              </div>

              {/* Withdrawal symptoms (if in recovery) */}
              {isInRecovery && (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  <h4 className="font-medium text-sm">Withdrawal Symptoms</h4>
                  <p className="text-sm text-muted-foreground">
                    Please describe any withdrawal symptoms you experienced yesterday
                  </p>
                  {withdrawalEntries.map((entry, idx) => (
                    <div key={idx} className="space-y-3 p-3 bg-background rounded border">
                      <div className="space-y-2">
                        <Label>Drug Name</Label>
                        <Input
                          placeholder="e.g., Alcohol, Nicotine"
                          value={entry.drugName}
                          onChange={(e) => {
                            const newEntries = [...withdrawalEntries];
                            newEntries[idx].drugName = e.target.value;
                            setWithdrawalEntries(newEntries);
                          }}
                          data-testid={`input-withdrawal-drug-${idx}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Symptoms</Label>
                        <Textarea
                          placeholder="Describe symptoms (e.g., headache, nausea, anxiety)"
                          value={entry.symptoms}
                          onChange={(e) => {
                            const newEntries = [...withdrawalEntries];
                            newEntries[idx].symptoms = e.target.value;
                            setWithdrawalEntries(newEntries);
                          }}
                          data-testid={`textarea-withdrawal-symptoms-${idx}`}
                        />
                      </div>
                      {withdrawalEntries.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newEntries = [...withdrawalEntries];
                            newEntries.splice(idx, 1);
                            setWithdrawalEntries(newEntries);
                          }}
                          data-testid={`button-remove-withdrawal-${idx}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setWithdrawalEntries([...withdrawalEntries, { drugName: '', symptoms: '' }]);
                    }}
                    data-testid="button-add-withdrawal"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Another Entry
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 11: Summary */}
          {currentStep === 11 && (
            <div className="space-y-6" data-testid="step-summary">
              <div className="flex items-center gap-2 mb-4">
                <Check className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">Review Your Check-In</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Please review your entries below. Click on any section to go back and edit.
              </p>

              <div className="space-y-4">
                {/* Mental Health Summary */}
                <div className="p-4 bg-muted/30 rounded-lg border cursor-pointer hover-elevate" onClick={() => setCurrentStep(1)}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Mental Health
                    </h4>
                    <Button variant="ghost" size="sm" type="button">Edit</Button>
                  </div>
                  <p className="text-sm"><strong>Rating:</strong> {form.watch('mentalRating')}</p>
                  {form.watch('mentalWhy') && <p className="text-sm text-muted-foreground">{form.watch('mentalWhy')}</p>}
                </div>

                {/* Sleep Summary */}
                <div className="p-4 bg-muted/30 rounded-lg border cursor-pointer hover-elevate" onClick={() => setCurrentStep(2)}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Sleep
                    </h4>
                    <Button variant="ghost" size="sm" type="button">Edit</Button>
                  </div>
                  <p className="text-sm"><strong>Sleep:</strong> {form.watch('sleepStart')} - {form.watch('sleepEnd')}</p>
                  <p className="text-sm"><strong>Dreams:</strong> {form.watch('dreamType')}</p>
                </div>

                {/* Workout Summary */}
                <div className="p-4 bg-muted/30 rounded-lg border cursor-pointer hover-elevate" onClick={() => setCurrentStep(3)}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Dumbbell className="h-4 w-4" />
                      Workout
                    </h4>
                    <Button variant="ghost" size="sm" type="button">Edit</Button>
                  </div>
                  {didWorkout ? (
                    <>
                      <p className="text-sm"><strong>Date:</strong> {form.watch('workoutDate')}</p>
                      <p className="text-sm"><strong>Sessions:</strong> {workoutSessions.length}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No workout logged</p>
                  )}
                </div>

                {/* Weight Summary */}
                <div className="p-4 bg-muted/30 rounded-lg border cursor-pointer hover-elevate" onClick={() => setCurrentStep(4)}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Weight
                    </h4>
                    <Button variant="ghost" size="sm" type="button">Edit</Button>
                  </div>
                  {didWeighIn && form.watch('weightLbs') ? (
                    <p className="text-sm"><strong>Weight:</strong> {form.watch('weightLbs')} lbs</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No weight logged</p>
                  )}
                </div>

                {/* Meditation Summary */}
                <div className="p-4 bg-muted/30 rounded-lg border cursor-pointer hover-elevate" onClick={() => setCurrentStep(5)}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Wind className="h-4 w-4" />
                      Meditation
                    </h4>
                    <Button variant="ghost" size="sm" type="button">Edit</Button>
                  </div>
                  {didMeditate && form.watch('meditationMin') ? (
                    <p className="text-sm"><strong>Duration:</strong> {form.watch('meditationMin')} minutes</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No meditation logged</p>
                  )}
                </div>

                {/* Work Summary */}
                <div className="p-4 bg-muted/30 rounded-lg border cursor-pointer hover-elevate" onClick={() => setCurrentStep(6)}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Coffee className="h-4 w-4" />
                      Work Stress
                    </h4>
                    <Button variant="ghost" size="sm" type="button">Edit</Button>
                  </div>
                  {form.watch('workStress') ? (
                    <>
                      <p className="text-sm"><strong>Stress Level:</strong> {form.watch('workStress')}</p>
                      {form.watch('workWhy') && <p className="text-sm mt-1">{form.watch('workWhy')}</p>}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No work stress logged</p>
                  )}
                </div>

                {/* Hobbies Summary */}
                <div className="p-4 bg-muted/30 rounded-lg border cursor-pointer hover-elevate" onClick={() => setCurrentStep(7)}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Hobbies
                    </h4>
                    <Button variant="ghost" size="sm" type="button">Edit</Button>
                  </div>
                  {form.watch('yesterdayHobby') ? (
                    <>
                      <p className="text-sm"><strong>Activity:</strong> {form.watch('yesterdayHobby')}</p>
                      {form.watch('hobbyDuration') && (
                        <p className="text-sm"><strong>Duration:</strong> {form.watch('hobbyDuration')} minutes</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hobbies logged</p>
                  )}
                </div>

                {/* Social Summary */}
                <div className="p-4 bg-muted/30 rounded-lg border cursor-pointer hover-elevate" onClick={() => setCurrentStep(8)}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Social Activities
                    </h4>
                    <Button variant="ghost" size="sm" type="button">Edit</Button>
                  </div>
                  {form.watch('yesterdaySocial') ? (
                    <>
                      <p className="text-sm"><strong>Activity:</strong> {form.watch('yesterdaySocial')}</p>
                      {form.watch('socialDuration') && (
                        <p className="text-sm"><strong>Duration:</strong> {form.watch('socialDuration')} minutes</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No social activities logged</p>
                  )}
                </div>

                {/* Recovery Summary */}
                <div className="p-4 bg-muted/30 rounded-lg border cursor-pointer hover-elevate" onClick={() => setCurrentStep(9)}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Coffee className="h-4 w-4" />
                      Recovery
                    </h4>
                    <Button variant="ghost" size="sm" type="button">Edit</Button>
                  </div>
                  {didUseDrugs ? (
                    <p className="text-sm"><strong>Drugs logged:</strong> {drugEntries.filter(e => e.drugName.trim()).length}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No drug use logged</p>
                  )}
                  {isInRecovery && (
                    <p className="text-sm"><strong>Withdrawal entries:</strong> {withdrawalEntries.filter(e => e.drugName.trim()).length}</p>
                  )}
                </div>

                {/* Calories Summary */}
                <div className="p-4 bg-muted/30 rounded-lg border cursor-pointer hover-elevate" onClick={() => setCurrentStep(9)}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Nutrition
                    </h4>
                    <Button variant="ghost" size="sm" type="button">Edit</Button>
                  </div>
                  {caloriesConsumed ? (
                    <>
                      <p className="text-sm"><strong>Calories:</strong> {caloriesConsumed} kcal</p>
                      {form.watch('proteinG') && <p className="text-sm"><strong>Protein:</strong> {form.watch('proteinG')}g</p>}
                      {goals?.kcalGoal && (
                        <p className={`text-sm font-medium ${caloriesConsumed <= goals.kcalGoal ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {caloriesConsumed <= goals.kcalGoal ? '✓ Under target' : 'Over target'}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No calories logged</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t gap-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                data-testid="button-wizard-back"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              {currentStep === 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    onClose();
                    toast({
                      title: 'Check-In Skipped',
                      description: 'You can complete it later from the dashboard',
                    });
                  }}
                  data-testid="button-already-checked-in"
                >
                  Already Checked-In
                </Button>
              )}
            </div>

            <Button
              type="button"
              onClick={handleNext}
              disabled={submitCheckIn.isPending || isMeditating}
              data-testid="button-wizard-next"
            >
              {currentStep === totalSteps ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Complete Check-In
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
