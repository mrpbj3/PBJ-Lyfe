"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardCard } from "@/components/DashboardCard";
import { useState, useMemo } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/apiClient";

export default function ProfileDetailed() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: profile, refetch } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => apiClient('/api/profile'),
    enabled: !!user,
  });

  const { data: checkins } = useQuery({
    queryKey: ["checkins", "recent", user?.id],
    queryFn: () => apiClient('/api/checkins/recent'),
    enabled: !!user,
  });

  // Fetch latest weight from body_metrics
  const { data: latestWeight } = useQuery({
    queryKey: ["weight", "latest", user?.id],
    queryFn: () => apiClient('/api/weight'),
    enabled: !!user,
  });

  const [edit, setEdit] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // Get the current sleep goal value (from edit state or profile)
  const currentSleepMinutes = edit.sleep_target_minutes !== undefined 
    ? edit.sleep_target_minutes 
    : (profile?.sleep_target_minutes || 0);

  // Convert minutes to hours and remaining minutes
  const sleepConversion = useMemo(() => {
    const mins = Number(currentSleepMinutes) || 0;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return { hours, minutes: remainingMins, total: mins };
  }, [currentSleepMinutes]);

  // Get current weight from latest weigh-in
  const currentWeight = useMemo(() => {
    if (latestWeight && Array.isArray(latestWeight) && latestWeight.length > 0) {
      // Weight is stored in kg, return the most recent one
      return latestWeight[0]?.weightKg;
    }
    return null;
  }, [latestWeight]);

  if (!profile) return <div className="p-8">Loading…</div>;

  const save = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from("profiles").update(edit).eq("id", user?.id);
      if (error) {
        toast({ 
          title: "Sorry, we could not save your changes. Please try again later.",
          variant: "destructive",
          className: "bg-red-500 text-white border-red-600"
        });
        return;
      }
      await refetch();
      setEdit({});
      toast({ 
        title: "Changes Saved!",
        className: "bg-green-500 text-white border-green-600"
      });
    } catch (err) {
      toast({ 
        title: "Sorry, we could not save your changes. Please try again later.",
        variant: "destructive",
        className: "bg-red-500 text-white border-red-600"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const labelFor = (d:string) =>
    new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  // Available color options
  const colorOptions = [
    { value: "#3B82F6", label: "Blue" },
    { value: "#10B981", label: "Green" },
    { value: "#F59E0B", label: "Orange" },
    { value: "#EF4444", label: "Red" },
    { value: "#8B5CF6", label: "Violet" },
    { value: "#EC4899", label: "Pink" },
  ];

  const currentColor = edit.profile_color !== undefined ? edit.profile_color : profile.profile_color;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/today">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Today
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold mb-8">Detailed Profile</h1>

        {/* SECTION 1: Profile Information */}
        <DashboardCard title="Profile Information">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-base font-semibold">Name:</Label>
              <div className="grid sm:grid-cols-2 gap-4 mt-2">
                <Input 
                  id="firstName"
                  defaultValue={profile.first_name || ""} 
                  onChange={(e)=>setEdit((x:any)=>({...x, first_name:e.target.value}))} 
                  placeholder="First name"
                />
                <Input 
                  id="lastName"
                  defaultValue={profile.last_name || ""} 
                  onChange={(e)=>setEdit((x:any)=>({...x, last_name:e.target.value}))} 
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* Profile Color */}
            <div>
              <Label htmlFor="profileColor" className="text-base font-semibold">Profile Color:</Label>
              <div className="flex items-center gap-4 mt-2">
                <Select 
                  value={currentColor || "#3B82F6"} 
                  onValueChange={(value) => setEdit((x:any)=>({...x, profile_color: value}))}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-300" 
                        style={{ backgroundColor: currentColor || "#3B82F6" }}
                      />
                      <SelectValue placeholder="Select a color" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300" 
                            style={{ backgroundColor: color.value }}
                          />
                          <span>{color.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* SECTION 2: Goals */}
        <DashboardCard title="Goals">
          <div className="space-y-4">
            {/* Height */}
            <div>
              <Label className="text-base font-semibold">Height:</Label>
              <div className="grid sm:grid-cols-2 gap-4 mt-2">
                <Input 
                  id="height"
                  type="number"
                  step="0.1"
                  defaultValue={profile.starting_height_cm || ""} 
                  onChange={(e)=>setEdit((x:any)=>({...x, starting_height_cm:+e.target.value}))} 
                  placeholder="Height"
                />
                <Select 
                  value={edit.units_height !== undefined ? edit.units_height : (profile.units_height || "cm")} 
                  onValueChange={(value) => setEdit((x:any)=>({...x, units_height: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="in">in</SelectItem>
                    <SelectItem value="ft">ft/in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Your height: {profile.starting_height_cm || 0} {profile.units_height || 'cm'}
              </p>
            </div>

            {/* Current Weight (read-only, from most recent weigh-in) */}
            <div>
              <Label className="text-base font-semibold">Current Weight:</Label>
              <div className="mt-2 p-3 bg-muted rounded-md">
                {currentWeight ? (
                  <p className="text-lg font-medium">
                    {profile.units_weight === 'lbs' 
                      ? `${(currentWeight * 2.20462).toFixed(1)} lbs`
                      : `${currentWeight.toFixed(1)} kg`
                    }
                  </p>
                ) : (
                  <p className="text-muted-foreground">No weigh-in recorded yet</p>
                )}
                <p className="text-xs text-muted-foreground">Auto-filled from most recent weigh-in</p>
              </div>
            </div>

            {/* Target Weight */}
            <div>
              <Label className="text-base font-semibold">Target Weight:</Label>
              <div className="grid sm:grid-cols-2 gap-4 mt-2">
                <Input 
                  id="targetWeight"
                  type="number"
                  step="0.1"
                  defaultValue={profile.target_weight || ""} 
                  onChange={(e)=>setEdit((x:any)=>({...x, target_weight:+e.target.value}))} 
                  placeholder="Target weight"
                />
                <Select 
                  value={edit.units_weight !== undefined ? edit.units_weight : (profile.units_weight || "lbs")} 
                  onValueChange={(value) => setEdit((x:any)=>({...x, units_weight: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lbs">lbs</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Calorie Target */}
            <div>
              <Label htmlFor="calorieTarget" className="text-base font-semibold">Calorie Target:</Label>
              <Input 
                id="calorieTarget"
                type="number"
                className="mt-2"
                defaultValue={profile.calorie_target || ""} 
                onChange={(e)=>setEdit((x:any)=>({...x, calorie_target:+e.target.value}))} 
                placeholder="Daily calorie target"
              />
            </div>

            {/* Sleep Goal */}
            <div>
              <Label htmlFor="sleepGoal" className="text-base font-semibold">Sleep Goal:</Label>
              <Input 
                id="sleepGoal"
                type="number"
                className="mt-2"
                defaultValue={profile.sleep_target_minutes || ""} 
                onChange={(e)=>setEdit((x:any)=>({...x, sleep_target_minutes:+e.target.value}))} 
                placeholder="Sleep target (minutes)"
              />
              {sleepConversion.total > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {sleepConversion.total} minutes = {sleepConversion.hours} hours {sleepConversion.minutes} minutes
                  <br />
                  <span className="text-xs">(We recommend 6–9 hours of sleep)</span>
                </p>
              )}
            </div>

            {/* Workout Goal */}
            <div>
              <Label htmlFor="workoutGoal" className="text-base font-semibold">Workout Goal:</Label>
              <Input 
                id="workoutGoal"
                type="number"
                className="mt-2"
                defaultValue={profile.workout_days_target || ""} 
                onChange={(e)=>setEdit((x:any)=>({...x, workout_days_target:+e.target.value}))} 
                placeholder="Workout days per week"
              />
            </div>
          </div>

          <Button onClick={save} disabled={isSaving} className="mt-6 w-full">
            {isSaving ? 'Saving...' : 'Save all changes'}
          </Button>
        </DashboardCard>

        {/* SECTION 2: Recent Check-Ins */}
        <DashboardCard title="Recent Check-Ins">
          {checkins && checkins.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-accent">
                  <tr>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Check-In</th>
                  </tr>
                </thead>
                <tbody>
                  {checkins.map((c:any)=>(
                    <tr 
                      key={c.id} 
                      className="hover:bg-muted cursor-pointer border-t" 
                      onClick={()=> window.location.href = `/checkins/${c.for_date}`}
                    >
                      <td className="p-3">{labelFor(c.for_date)}</td>
                      <td className="p-3">{labelFor(c.for_date)} Daily Check-In Results</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">No check-ins found.</p>
          )}
          
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={()=> window.location.href = "/checkins/all"}
          >
            View All
          </Button>
        </DashboardCard>
      </div>
    </div>
  );
}
