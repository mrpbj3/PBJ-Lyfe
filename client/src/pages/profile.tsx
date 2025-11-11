// PBJ Health - Profile & Settings Page
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useAuth as useAuthProvider } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const PBJ = {
  purple: "#AB13E6",
  gold: "#C38452",
};

export default function Profile() {
  const [, navigate] = useLocation();
  const { user: authUser, loading: authLoading } = useAuthProvider();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);

  const [goalWeight, setGoalWeight] = useState('');
  const [kcalGoal, setKcalGoal] = useState('2000');
  const [stepGoal, setStepGoal] = useState('10000');

  // Check if this is first-time setup or profile edit
  useEffect(() => {
    if (authLoading || !authUser) return;
    
    (async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .eq("id", authUser.id)
          .maybeSingle();
        
        if (!profile || !profile.first_name) {
          setIsFirstTimeSetup(true);
          setFirstName('');
          setLastName('');
        } else {
          setIsFirstTimeSetup(false);
          setFirstName(profile.first_name || '');
          setLastName(profile.last_name || '');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setProfileLoading(false);
      }
    })();
  }, [authUser, authLoading]);

  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ['/api/goals'],
    enabled: !!authUser && !isFirstTimeSetup,
  });

  // Update state when goals data loads
  useEffect(() => {
    if (goals) {
      setGoalWeight(goals.goalWeightKg?.toString() || '');
      setKcalGoal(goals.kcalGoal?.toString() || '2000');
      setStepGoal(goals.stepGoal?.toString() || '10000');
    }
  }, [goals]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('PUT', '/api/goals', data);
    },
    onSuccess: () => {
      toast({ title: 'Goals updated successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      goalWeightKg: goalWeight ? parseFloat(goalWeight) : undefined,
      kcalGoal: parseInt(kcalGoal),
      stepGoal: parseInt(stepGoal),
    });
  };

  const handleFirstTimeSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your first name",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!authUser) {
        navigate("/login");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
        })
        .eq("id", authUser.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Profile created successfully!",
      });

      // Navigate to the today page after successful profile setup
      navigate("/today");
    } catch (err) {
      console.error("Profile setup error:", err);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!authUser) return null;

  // First-time setup view
  if (isFirstTimeSetup) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          background: `linear-gradient(135deg, ${PBJ.purple}22 0%, ${PBJ.gold}22 40%, transparent 100%)`,
        }}
      >
        <div className="w-full max-w-md">
          <div className="rounded-2xl shadow-xl border bg-white overflow-hidden">
            <div
              className="p-6 text-center"
              style={{
                background: `linear-gradient(180deg, ${PBJ.purple}10 0%, ${PBJ.gold}10 100%)`,
              }}
            >
              <div className="text-3xl font-extrabold tracking-tight">
                <span style={{ color: PBJ.purple }}>PBJ</span>{" "}
                <span style={{ color: PBJ.gold }}>LYFE</span>
              </div>
              <div className="mt-2 text-sm text-neutral-600">
                Let's set up your profile
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleFirstTimeSetup} className="space-y-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-neutral-700">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    className="mt-1"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium text-neutral-700">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    className="mt-1"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  style={{ background: PBJ.purple }}
                >
                  Complete Setup
                </Button>
              </form>
            </div>
          </div>

          <div className="text-center text-xs text-neutral-500 mt-4">
            <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: PBJ.gold }} />
            Complete your profile to continue
          </div>
        </div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold mb-8">Profile & Settings</h1>
        
        <DashboardCard title="User Info" className="mb-6">
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Name:</span> {firstName} {lastName}
            </p>
            <p className="text-sm">
              <span className="font-medium">Email:</span> {authUser?.email}
            </p>
          </div>
        </DashboardCard>

        <DashboardCard title="Health Goals">
          {goalsLoading ? (
            <div className="text-sm text-muted-foreground">Loading goals...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="goalWeight">Goal Weight (kg)</Label>
              <Input
                id="goalWeight"
                type="number"
                step="0.1"
                value={goalWeight}
                onChange={(e) => setGoalWeight(e.target.value)}
                placeholder="75.0"
                data-testid="input-goal-weight"
              />
            </div>
            <div>
              <Label htmlFor="kcalGoal">Daily Calorie Goal</Label>
              <Input
                id="kcalGoal"
                type="number"
                value={kcalGoal}
                onChange={(e) => setKcalGoal(e.target.value)}
                data-testid="input-kcal-goal"
              />
            </div>
            <div>
              <Label htmlFor="stepGoal">Daily Step Goal</Label>
              <Input
                id="stepGoal"
                type="number"
                value={stepGoal}
                onChange={(e) => setStepGoal(e.target.value)}
                data-testid="input-step-goal"
              />
            </div>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-save-goals">
              {mutation.isPending ? 'Saving...' : 'Save Goals'}
            </Button>
          </form>
          )}
        </DashboardCard>
      </div>
    </div>
  );
}
