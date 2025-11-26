"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DashboardCard } from "@/components/DashboardCard";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { ArrowLeft, Plus, Trash2, User } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/apiClient";

interface RecoveryItem {
  drugName: string;
  startDate: string;
  prescribed: boolean;
  trackWithdrawal: boolean;
}

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
  
  // Recovery items state
  const [recoveryItems, setRecoveryItems] = useState<RecoveryItem[]>([]);
  const [recoveryInitialized, setRecoveryInitialized] = useState(false);
  
  // Initialize recovery items from profile
  useEffect(() => {
    if (profile?.recovery_items && !recoveryInitialized) {
      try {
        const items = typeof profile.recovery_items === 'string' 
          ? JSON.parse(profile.recovery_items) 
          : profile.recovery_items;
        if (Array.isArray(items)) {
          setRecoveryItems(items);
        }
      } catch (e) {
        console.error('Error parsing recovery items:', e);
      }
      setRecoveryInitialized(true);
    }
  }, [profile, recoveryInitialized]);

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
      return latestWeight[0]?.weightKg;
    }
    return null;
  }, [latestWeight]);
  
  // Compute initials
  const initials = useMemo(() => {
    const firstName = edit.first_name ?? profile?.first_name ?? '';
    const lastName = edit.last_name ?? profile?.last_name ?? '';
    return (firstName[0] || '') + (lastName[0] || '');
  }, [edit.first_name, edit.last_name, profile]);
  
  // In Recovery toggle
  const inRecovery = edit.in_recovery !== undefined ? edit.in_recovery : (profile?.in_recovery || false);
  
  // Sensitive data toggles
  const sensitiveData = edit.sensitive_data ?? profile?.sensitive_data ?? {
    sleep: false,
    dreams: false,
    mood: false,
    stress: false,
    calories: false,
    workouts: false,
  };
  
  const includeInSummaries = edit.include_in_summaries !== undefined 
    ? edit.include_in_summaries 
    : (profile?.include_in_summaries ?? true);

  if (!profile) return <div className="p-8">Loading…</div>;

  const save = async () => {
    setIsSaving(true);
    try {
      // Build complete update object including all edited fields
      const updateData: any = { ...edit };
      
      // Always include recovery_items if in recovery mode
      if (inRecovery || recoveryItems.length > 0) {
        updateData.recovery_items = JSON.stringify(recoveryItems);
      }
      
      // Ensure sensitive_data is properly serialized
      if (updateData.sensitive_data) {
        updateData.sensitive_data = JSON.stringify(updateData.sensitive_data);
      }
      
      console.log('Saving profile data:', updateData);
      
      const { error } = await supabase.from("profiles").update(updateData).eq("id", user?.id);
      if (error) {
        console.error('Save error:', error);
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
      console.error('Save exception:', err);
      toast({ 
        title: "Sorry, we could not save your changes. Please try again later.",
        variant: "destructive",
        className: "bg-red-500 text-white border-red-600"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePasswordReset = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user?.email || '', {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for the reset link.",
        className: "bg-green-500 text-white border-green-600"
      });
    } catch (err) {
      toast({
        title: "Failed to send reset email",
        variant: "destructive",
        className: "bg-red-500 text-white border-red-600"
      });
    }
  };
  
  const addRecoveryItem = () => {
    setRecoveryItems([...recoveryItems, {
      drugName: '',
      startDate: new Date().toISOString().split('T')[0],
      prescribed: false,
      trackWithdrawal: true,
    }]);
  };
  
  const removeRecoveryItem = (index: number) => {
    setRecoveryItems(recoveryItems.filter((_, i) => i !== index));
  };
  
  const updateRecoveryItem = (index: number, field: keyof RecoveryItem, value: any) => {
    const newItems = [...recoveryItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setRecoveryItems(newItems);
  };
  
  const updateSensitiveData = (category: string, value: boolean) => {
    const newSensitive = { ...sensitiveData, [category]: value };
    setEdit((x: any) => ({ ...x, sensitive_data: newSensitive }));
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
    { value: "#14B8A6", label: "Teal" },
    { value: "#F97316", label: "Amber" },
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

        {/* SECTION 1: Identity & Appearance */}
        <DashboardCard title="Identity & Appearance">
          <div className="space-y-4">
            {/* Initials Badge Preview */}
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: currentColor || "#3B82F6" }}
              >
                {initials.toUpperCase() || <User className="h-8 w-8" />}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profile Preview</p>
                <p className="font-medium">{initials ? `Initials: ${initials.toUpperCase()}` : 'Add your name'}</p>
              </div>
            </div>
            
            {/* First Name & Last Name */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName"
                  defaultValue={profile.first_name || ""} 
                  onChange={(e)=>setEdit((x:any)=>({...x, first_name:e.target.value}))} 
                  placeholder="First name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName"
                  defaultValue={profile.last_name || ""} 
                  onChange={(e)=>setEdit((x:any)=>({...x, last_name:e.target.value}))} 
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* Profile Color Picker */}
            <div>
              <Label>Profile Color</Label>
              <div className="grid grid-cols-8 gap-2 mt-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setEdit((x:any)=>({...x, profile_color: color.value}))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      currentColor === color.value ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* SECTION 2: Accounts & Basics */}
        <DashboardCard title="Accounts & Basics">
          <div className="space-y-4">
            {/* Email (read-only) */}
            <div>
              <Label>Email</Label>
              <Input 
                value={user?.email || ""} 
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            
            {/* Change Password Button */}
            <div>
              <Button 
                variant="outline" 
                onClick={handlePasswordReset}
                className="w-full sm:w-auto"
              >
                Change Password
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Sends a password reset email to your account
              </p>
            </div>
            
            {/* Units */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Weight Units</Label>
                <Select 
                  value={edit.units_weight !== undefined ? edit.units_weight : (profile.units_weight || "lb")} 
                  onValueChange={(value) => setEdit((x:any)=>({...x, units_weight: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lb">lb (pounds)</SelectItem>
                    <SelectItem value="kg">kg (kilograms)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Height Units</Label>
                <Select 
                  value={edit.units_height !== undefined ? edit.units_height : (profile.units_height || "cm")} 
                  onValueChange={(value) => setEdit((x:any)=>({...x, units_height: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ft/in">ft/in (feet & inches)</SelectItem>
                    <SelectItem value="cm">cm (centimeters)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Timezone */}
            <div>
              <Label>Timezone</Label>
              <Select 
                value={edit.timezone !== undefined ? edit.timezone : (profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)} 
                onValueChange={(value) => setEdit((x:any)=>({...x, timezone: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                  <SelectItem value="Pacific/Honolulu">Hawaii Time (HT)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Date Format */}
            <div>
              <Label>Date Format</Label>
              <Select 
                value={edit.date_format !== undefined ? edit.date_format : (profile.date_format || "mdy")} 
                onValueChange={(value) => setEdit((x:any)=>({...x, date_format: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mdy">MM/DD/YYYY (US)</SelectItem>
                  <SelectItem value="dmy">DD/MM/YYYY (International)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DashboardCard>

        {/* SECTION 3: Goals */}
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
                    <SelectItem value="ft/in">ft/in</SelectItem>
                    <SelectItem value="cm">cm</SelectItem>
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
                    {profile.units_weight === 'kg' 
                      ? `${currentWeight.toFixed(1)} kg`
                      : `${(currentWeight * 2.20462).toFixed(1)} lb`
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
                  value={edit.units_weight !== undefined ? edit.units_weight : (profile.units_weight || "lb")} 
                  onValueChange={(value) => setEdit((x:any)=>({...x, units_weight: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lb">lb</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Calorie Target */}
            <div>
              <Label htmlFor="calorieTarget" className="text-base font-semibold">Calories per day:</Label>
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
              <Label htmlFor="sleepGoal" className="text-base font-semibold">Sleep minutes per night:</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input 
                  id="sleepGoal"
                  type="number"
                  className="w-24"
                  defaultValue={profile.sleep_target_minutes || ""} 
                  onChange={(e)=>setEdit((x:any)=>({...x, sleep_target_minutes:+e.target.value}))} 
                  placeholder="0"
                />
                <span className="text-muted-foreground">minutes</span>
              </div>
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
              <Label htmlFor="workoutGoal" className="text-base font-semibold">Workout days per week:</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input 
                  id="workoutGoal"
                  type="number"
                  className="w-24"
                  min="0"
                  max="7"
                  defaultValue={profile.workout_days_target || ""} 
                  onChange={(e)=>setEdit((x:any)=>({...x, workout_days_target:+e.target.value}))} 
                  placeholder="0"
                />
                <span className="text-muted-foreground">days per week</span>
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* SECTION 4: Recovery Settings */}
        <DashboardCard title="Recovery Settings">
          <div className="space-y-4">
            {/* In Recovery Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">In Recovery</Label>
                <p className="text-sm text-muted-foreground">Track your recovery journey</p>
              </div>
              <Switch 
                checked={inRecovery}
                onCheckedChange={(checked) => setEdit((x:any)=>({...x, in_recovery: checked}))}
              />
            </div>
            
            {/* Recovery Items (shown when in recovery) */}
            {inRecovery && (
              <div className="space-y-4 pt-4 border-t">
                <p className="text-sm font-medium">Substances in recovery from:</p>
                
                {recoveryItems.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium">Item {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRecoveryItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <Label>Drug Name</Label>
                        <Input 
                          value={item.drugName}
                          onChange={(e) => updateRecoveryItem(index, 'drugName', e.target.value)}
                          placeholder="e.g., Alcohol, Nicotine"
                        />
                      </div>
                      <div>
                        <Label>Recovery Start Date</Label>
                        <Input 
                          type="date"
                          value={item.startDate}
                          onChange={(e) => updateRecoveryItem(index, 'startDate', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={item.prescribed}
                          onCheckedChange={(checked) => updateRecoveryItem(index, 'prescribed', checked)}
                        />
                        <Label>Prescribed?</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={item.trackWithdrawal}
                          onCheckedChange={(checked) => updateRecoveryItem(index, 'trackWithdrawal', checked)}
                        />
                        <Label>Track withdrawal symptoms?</Label>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRecoveryItem}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Substance
                </Button>
              </div>
            )}
          </div>
        </DashboardCard>

        {/* SECTION 5: Mr. PBJ Analytics Settings */}
        <DashboardCard title="Mr. PBJ Analytics Settings">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mark categories as "sensitive" to exclude them from AI insights and shared reports.
            </p>
            
            {/* Sensitive Data Toggles */}
            <div className="space-y-3">
              {[
                { key: 'sleep', label: 'Sleep' },
                { key: 'dreams', label: 'Dreams' },
                { key: 'mood', label: 'Mood' },
                { key: 'stress', label: 'Stress' },
                { key: 'calories', label: 'Calories' },
                { key: 'workouts', label: 'Workouts' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <Label>{label}</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sensitive</span>
                    <Switch 
                      checked={sensitiveData[key] || false}
                      onCheckedChange={(checked) => updateSensitiveData(key, checked)}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Include in Summaries */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <Label className="text-base font-semibold">Include in AI Summaries</Label>
                <p className="text-sm text-muted-foreground">Allow Mr. PBJ to analyze your data</p>
              </div>
              <Switch 
                checked={includeInSummaries}
                onCheckedChange={(checked) => setEdit((x:any)=>({...x, include_in_summaries: checked}))}
              />
            </div>
          </div>
        </DashboardCard>

        {/* SECTION 6: Notification Settings */}
        <DashboardCard title="Notification Settings">
          <div className="space-y-4">
            {/* Daily Check-in Reminder */}
            <div>
              <Label className="text-base font-semibold">Daily Check-in Reminder</Label>
              <div className="flex items-center gap-4 mt-2">
                <Input 
                  type="time"
                  className="w-32"
                  defaultValue={profile.checkin_reminder_time || "09:00"}
                  onChange={(e) => setEdit((x:any)=>({...x, checkin_reminder_time: e.target.value}))}
                />
                <span className="text-muted-foreground">each day</span>
              </div>
            </div>
            
            {/* Weekly Summary */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label className="text-base font-semibold">Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground">Receive a weekly health summary</p>
                </div>
                <Switch 
                  checked={edit.weekly_summary_enabled !== undefined ? edit.weekly_summary_enabled : (profile.weekly_summary_enabled ?? true)}
                  onCheckedChange={(checked) => setEdit((x:any)=>({...x, weekly_summary_enabled: checked}))}
                />
              </div>
              
              {(edit.weekly_summary_enabled ?? profile.weekly_summary_enabled ?? true) && (
                <div className="flex items-center gap-4">
                  <Select 
                    value={edit.weekly_summary_day !== undefined ? edit.weekly_summary_day : (profile.weekly_summary_day || "sunday")} 
                    onValueChange={(value) => setEdit((x:any)=>({...x, weekly_summary_day: value}))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunday">Sunday</SelectItem>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="saturday">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">at</span>
                  <Input 
                    type="time"
                    className="w-32"
                    defaultValue={profile.weekly_summary_time || "09:00"}
                    onChange={(e) => setEdit((x:any)=>({...x, weekly_summary_time: e.target.value}))}
                  />
                </div>
              )}
            </div>
          </div>
        </DashboardCard>

        {/* Save Button */}
        <Button onClick={save} disabled={isSaving} className="w-full" size="lg">
          {isSaving ? 'Saving...' : 'Save all changes'}
        </Button>

        {/* SECTION 7: Recent Check-Ins */}
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
