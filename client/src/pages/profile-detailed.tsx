// PBJ Health - Profile Detailed Page
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function ProfileDetailed() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/profile-detailed'],
    enabled: isAuthenticated,
  });

  const { data: checkIns, isLoading: checkInsLoading } = useQuery({
    queryKey: ['/api/check-ins', { limit: 7 }],
    queryFn: async () => {
      const response = await fetch('/api/check-ins?limit=7', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch check-ins');
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [startingWeight, setStartingWeight] = useState('');
  const [unitsWeight, setUnitsWeight] = useState('lbs');
  const [startingHeightCm, setStartingHeightCm] = useState('');
  const [unitsHeight, setUnitsHeight] = useState('cm');
  const [calorieTarget, setCalorieTarget] = useState('2000');
  const [sleepTargetMinutes, setSleepTargetMinutes] = useState('480');
  const [workoutDaysTarget, setWorkoutDaysTarget] = useState('3');
  const [profileColor, setProfileColor] = useState('#3b82f6');
  const [showAllCheckIns, setShowAllCheckIns] = useState(false);

  const { data: allCheckIns } = useQuery({
    queryKey: ['/api/check-ins'],
    queryFn: async () => {
      const response = await fetch('/api/check-ins', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch all check-ins');
      return response.json();
    },
    enabled: isAuthenticated && showAllCheckIns,
  });

  // Update state when profile data loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setStartingWeight(profile.startingWeight?.toString() || '');
      setUnitsWeight(profile.unitsWeight || 'lbs');
      setStartingHeightCm(profile.startingHeightCm?.toString() || '');
      setUnitsHeight(profile.unitsHeight || 'cm');
      setCalorieTarget(profile.calorieTarget?.toString() || '2000');
      setSleepTargetMinutes(profile.sleepTargetMinutes?.toString() || '480');
      setWorkoutDaysTarget(profile.workoutDaysTarget?.toString() || '3');
      setProfileColor(profile.profileColor || '#3b82f6');
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('PUT', '/api/profile-detailed', data);
    },
    onSuccess: () => {
      toast({ title: 'Profile updated successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/profile-detailed'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      firstName,
      lastName,
      startingWeight: startingWeight ? parseFloat(startingWeight) : null,
      unitsWeight,
      startingHeightCm: startingHeightCm ? parseFloat(startingHeightCm) : null,
      unitsHeight,
      calorieTarget: parseInt(calorieTarget),
      sleepTargetMinutes: parseInt(sleepTargetMinutes),
      workoutDaysTarget: parseInt(workoutDaysTarget),
      profileColor,
    });
  };

  if (!isAuthenticated) return null;

  const displayCheckIns = showAllCheckIns ? allCheckIns : checkIns;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/today">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Profile Details</h1>
        
        {/* SECTION 1: Profile Editor */}
        <DashboardCard title="Profile Information" className="mb-6">
          {profileLoading ? (
            <div className="text-sm text-muted-foreground">Loading profile...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name:</Label>
                <div className="flex gap-2">
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                  />
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="weight">Weight:</Label>
                <div className="flex gap-2">
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={startingWeight}
                    onChange={(e) => setStartingWeight(e.target.value)}
                    placeholder="Starting weight"
                  />
                  <Select value={unitsWeight} onValueChange={setUnitsWeight}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lbs">lbs</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="height">Height:</Label>
                <div className="flex gap-2">
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    value={startingHeightCm}
                    onChange={(e) => setStartingHeightCm(e.target.value)}
                    placeholder="Height in cm"
                  />
                  <Select value={unitsHeight} onValueChange={setUnitsHeight}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cm">cm</SelectItem>
                      <SelectItem value="inches">inches</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="calorieTarget">Calorie Target:</Label>
                <Input
                  id="calorieTarget"
                  type="number"
                  value={calorieTarget}
                  onChange={(e) => setCalorieTarget(e.target.value)}
                  placeholder="Daily calorie target"
                />
              </div>

              <div>
                <Label htmlFor="sleepGoal">Sleep Goal:</Label>
                <Input
                  id="sleepGoal"
                  type="number"
                  value={sleepTargetMinutes}
                  onChange={(e) => setSleepTargetMinutes(e.target.value)}
                  placeholder="Minutes per night"
                />
              </div>

              <div>
                <Label htmlFor="workoutGoal">Workout Goal:</Label>
                <Input
                  id="workoutGoal"
                  type="number"
                  value={workoutDaysTarget}
                  onChange={(e) => setWorkoutDaysTarget(e.target.value)}
                  placeholder="Days per week"
                />
              </div>

              <div>
                <Label htmlFor="profileColor">Profile Color:</Label>
                <Select value={profileColor} onValueChange={setProfileColor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="#3b82f6">Blue</SelectItem>
                    <SelectItem value="#10b981">Green</SelectItem>
                    <SelectItem value="#f59e0b">Orange</SelectItem>
                    <SelectItem value="#ef4444">Red</SelectItem>
                    <SelectItem value="#8b5cf6">Purple</SelectItem>
                    <SelectItem value="#ec4899">Pink</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </form>
          )}
        </DashboardCard>

        {/* SECTION 2: Recent Check-Ins */}
        <DashboardCard title="Recent Check-Ins" className="mb-6">
          {checkInsLoading ? (
            <div className="text-sm text-muted-foreground">Loading check-ins...</div>
          ) : (
            <div className="space-y-4">
              {displayCheckIns && displayCheckIns.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {displayCheckIns.map((checkIn: any) => (
                      <div key={checkIn.id} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <p className="font-medium">{new Date(checkIn.date).toLocaleDateString()}</p>
                          {checkIn.notes && <p className="text-sm text-muted-foreground">{checkIn.notes}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{checkIn.weight} lbs</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!showAllCheckIns && checkIns && checkIns.length >= 7 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowAllCheckIns(true)}
                      className="w-full"
                    >
                      View All
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No check-ins yet</p>
              )}
            </div>
          )}
        </DashboardCard>
      </div>
    </div>
  );
}
