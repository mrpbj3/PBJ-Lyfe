"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DashboardCard } from "@/components/DashboardCard";
import { useState, useMemo } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { ArrowLeft, Plus, Trash2, User } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/apiClient";

interface RecoveryItem {
  name: string;
  start_date: string;
  prescribed: boolean;
  track_withdrawal: boolean;
}

export default function ProfileDetailed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

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

  // Fetch current weight from most recent daily_summary
  const { data: latestWeight } = useQuery({
    queryKey: ["latest-weight", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_summary")
        .select("weight_kg, summary_date")
        .eq("user_id", user?.id)
        .not("weight_kg", "is", null)
        .order("summary_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const [edit, setEdit] = useState<any>({});
  const [recoveryItems, setRecoveryItems] = useState<RecoveryItem[]>([]);
  const [recoveryInitialized, setRecoveryInitialized] = useState(false);

  // Initialize recovery items from profile
  if (profile?.recovery_items && !recoveryInitialized) {
    setRecoveryItems(profile.recovery_items);
    setRecoveryInitialized(true);
  }

  if (!profile) return <div className="p-8">Loading…</div>;

  // Compute sleep goal in hours and minutes for display
  const sleepMinutes = edit.sleep_target_minutes ?? profile.sleep_target_minutes ?? 0;
  const sleepHours = Math.floor(sleepMinutes / 60);
  const sleepMins = sleepMinutes % 60;

  const save = async () => {
    setIsSaving(true);
    try {
      const updateData = {
        ...edit,
        recovery_items: recoveryItems,
      };
      const { error } = await supabase.from("profiles").update(updateData).eq("id", user?.id);
      if (error) {
        toast({ 
          title: "Error", 
          description: "Sorry, we could not save your changes. Please try again later.", 
          variant: "destructive",
          className: "fixed bottom-4 right-4"
        });
        setIsSaving(false);
        return;
      }
      await refetch();
      setEdit({});
      toast({ 
        title: "Changes Saved!", 
        description: "Your profile has been updated.",
        className: "bg-green-500 text-white fixed bottom-4 right-4"
      });
    } catch (err) {
      toast({ 
        title: "Error", 
        description: "Sorry, we could not save your changes. Please try again later.", 
        variant: "destructive",
        className: "fixed bottom-4 right-4"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user?.email || '', {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) throw error;
      toast({ title: "Success", description: "Password reset email sent!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send reset email", variant: "destructive" });
    }
  };

  const addRecoveryItem = () => {
    setRecoveryItems([...recoveryItems, {
      name: '',
      start_date: new Date().toISOString().split('T')[0],
      prescribed: false,
      track_withdrawal: true,
    }]);
  };

  const removeRecoveryItem = (index: number) => {
    setRecoveryItems(recoveryItems.filter((_, i) => i !== index));
  };

  const updateRecoveryItem = (index: number, field: keyof RecoveryItem, value: any) => {
    const updated = [...recoveryItems];
    updated[index] = { ...updated[index], [field]: value };
    setRecoveryItems(updated);
  };

  const labelFor = (d: string) =>
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
    { value: "#F97316", label: "Deep Orange" },
  ];

  const currentColor = edit.profile_color !== undefined ? edit.profile_color : profile.profile_color;
  const inRecovery = edit.in_recovery !== undefined ? edit.in_recovery : profile.in_recovery;

  // Generate initials
  const firstName = edit.first_name ?? profile.first_name ?? '';
  const lastName = edit.last_name ?? profile.last_name ?? '';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'PB';

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
        <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

        {/* SECTION 1: Identity & Appearance */}
        <DashboardCard title="Identity & Appearance">
          <div className="space-y-4">
            {/* Initials Badge Preview */}
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: currentColor || "#3B82F6" }}
              >
                {initials}
              </div>
              <div>
                <p className="font-medium">{firstName} {lastName}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            {/* Name */}
            <div>
              <Label className="text-base font-semibold">Name</Label>
              <div className="grid sm:grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="firstName" className="text-sm text-muted-foreground">First name</Label>
                  <Input
                    id="firstName"
                    defaultValue={profile.first_name || ""}
                    onChange={(e) => setEdit((x: any) => ({ ...x, first_name: e.target.value }))}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm text-muted-foreground">Last name</Label>
                  <Input
                    id="lastName"
                    defaultValue={profile.last_name || ""}
                    onChange={(e) => setEdit((x: any) => ({ ...x, last_name: e.target.value }))}
                    placeholder="Last name"
                  />
                </div>
              </div>
            </div>

            {/* Profile Color */}
            <div>
              <Label className="text-base font-semibold">Profile Color</Label>
              <Select
                value={currentColor || "#3B82F6"}
                onValueChange={(value) => setEdit((x: any) => ({ ...x, profile_color: value }))}
              >
                <SelectTrigger className="mt-2">
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
        </DashboardCard>

        {/* SECTION 2: Account & Basics */}
        <DashboardCard title="Account & Basics">
          <div className="space-y-4">
            {/* Email (read-only) */}
            <div>
              <Label className="text-base font-semibold">Email</Label>
              <Input
                value={user?.email || ''}
                disabled
                className="mt-2 bg-muted"
              />
            </div>

            {/* Change Password */}
            <div>
              <Button variant="outline" onClick={handlePasswordReset}>
                Change Password
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                We'll send a password reset link to your email
              </p>
            </div>

            {/* Timezone */}
            <div>
              <Label className="text-base font-semibold">Timezone</Label>
              <Select
                value={edit.timezone ?? profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}
                onValueChange={(value) => setEdit((x: any) => ({ ...x, timezone: value }))}
              >
                <SelectTrigger className="mt-2">
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
                </SelectContent>
              </Select>
            </div>

            {/* Date Format */}
            <div>
              <Label className="text-base font-semibold">Date Format</Label>
              <Select
                value={edit.date_format ?? profile.date_format ?? 'mdy'}
                onValueChange={(value) => setEdit((x: any) => ({ ...x, date_format: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mdy">MM/DD/YYYY (US)</SelectItem>
                  <SelectItem value="dmy">DD/MM/YYYY (UK/EU)</SelectItem>
                  <SelectItem value="ymd">YYYY-MM-DD (ISO)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DashboardCard>

        {/* SECTION 3: Units */}
        <DashboardCard title="Units">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-semibold">Weight Units</Label>
              <Select
                value={edit.units_weight ?? profile.units_weight ?? "lb"}
                onValueChange={(value) => setEdit((x: any) => ({ ...x, units_weight: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lb">lb (pounds)</SelectItem>
                  <SelectItem value="kg">kg (kilograms)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-base font-semibold">Height Units</Label>
              <Select
                value={edit.units_height ?? profile.units_height ?? "ft/in"}
                onValueChange={(value) => setEdit((x: any) => ({ ...x, units_height: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ft/in">ft/in (feet & inches)</SelectItem>
                  <SelectItem value="cm">cm (centimeters)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DashboardCard>

        {/* SECTION 4: Goals */}
        <DashboardCard title="Goals">
          <div className="space-y-4">
            {/* Height Display */}
            <div>
              <Label className="text-base font-semibold">Height</Label>
              <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">
                  {profile.starting_height_cm || "Not set"} {profile.units_height === "cm" ? "cm" : "ft/in"}
                </p>
              </div>
            </div>

            {/* Current Weight (from latest weigh-in) */}
            <div>
              <Label className="text-base font-semibold">Current Weight</Label>
              <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                {latestWeight?.weight_kg ? (
                  <p className="font-medium">
                    {(edit.units_weight ?? profile.units_weight) === "kg" 
                      ? `${latestWeight.weight_kg.toFixed(1)} kg`
                      : `${(latestWeight.weight_kg * 2.20462).toFixed(1)} lb`
                    }
                    <span className="text-sm text-muted-foreground ml-2">
                      (Last weighed: {new Date(latestWeight.summary_date).toLocaleDateString()})
                    </span>
                  </p>
                ) : (
                  <p className="text-muted-foreground">No weigh-ins recorded yet</p>
                )}
              </div>
            </div>

            {/* Target Weight */}
            <div>
              <Label className="text-base font-semibold">Target Weight</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="number"
                  step="0.1"
                  className="w-32"
                  defaultValue={profile.target_weight || ""}
                  onChange={(e) => setEdit((x: any) => ({ ...x, target_weight: +e.target.value }))}
                  placeholder="150"
                />
                <span className="text-muted-foreground">
                  {(edit.units_weight ?? profile.units_weight) === "kg" ? "kg" : "lb"}
                </span>
              </div>
            </div>

            {/* Calorie Target */}
            <div>
              <Label className="text-base font-semibold">Daily Calorie Target</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="number"
                  className="w-32"
                  defaultValue={profile.calorie_target || ""}
                  onChange={(e) => setEdit((x: any) => ({ ...x, calorie_target: +e.target.value }))}
                  placeholder="2000"
                />
                <span className="text-muted-foreground">calories</span>
              </div>
            </div>

            {/* Workout Goal */}
            <div>
              <Label className="text-base font-semibold">Workout Goal</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="number"
                  className="w-32"
                  min="0"
                  max="7"
                  defaultValue={profile.workout_days_target || ""}
                  onChange={(e) => setEdit((x: any) => ({ ...x, workout_days_target: +e.target.value }))}
                  placeholder="3"
                />
                <span className="text-muted-foreground">days per week</span>
              </div>
            </div>

            {/* Sleep Goal */}
            <div>
              <Label className="text-base font-semibold">Sleep Goal</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="number"
                  className="w-32"
                  value={edit.sleep_target_minutes ?? profile.sleep_target_minutes ?? ''}
                  onChange={(e) => setEdit((x: any) => ({ ...x, sleep_target_minutes: +e.target.value }))}
                  placeholder="480"
                />
                <span className="text-muted-foreground">minutes</span>
              </div>
              {sleepMinutes > 0 && (
                <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted/30 rounded">
                  {sleepMinutes} minutes = {sleepHours} hours {sleepMins > 0 ? `${sleepMins} minutes` : ''}
                  <br />
                  <span className="text-xs">(We recommend 6–9 hours of sleep)</span>
                </p>
              )}
            </div>
          </div>
        </DashboardCard>

        {/* SECTION 5: Recovery Settings */}
        <DashboardCard title="Recovery Settings">
          <div className="space-y-4">
            {/* In Recovery Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base font-medium">In Recovery</Label>
                <p className="text-sm text-muted-foreground">
                  Enable to track your recovery journey
                </p>
              </div>
              <Switch
                checked={inRecovery || false}
                onCheckedChange={(checked) => setEdit((x: any) => ({ ...x, in_recovery: checked }))}
              />
            </div>

            {/* Recovery Items */}
            {inRecovery && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Substances in Recovery</Label>
                
                {recoveryItems.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label className="text-sm">Drug/Substance Name</Label>
                          <Input
                            value={item.name}
                            onChange={(e) => updateRecoveryItem(index, 'name', e.target.value)}
                            placeholder="e.g., Alcohol"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Recovery Start Date</Label>
                          <Input
                            type="date"
                            value={item.start_date}
                            onChange={(e) => updateRecoveryItem(index, 'start_date', e.target.value)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Prescribed?</Label>
                          <Switch
                            checked={item.prescribed}
                            onCheckedChange={(checked) => updateRecoveryItem(index, 'prescribed', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Track Withdrawal Symptoms?</Label>
                          <Switch
                            checked={item.track_withdrawal}
                            onCheckedChange={(checked) => updateRecoveryItem(index, 'track_withdrawal', checked)}
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2 text-destructive"
                        onClick={() => removeRecoveryItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button variant="outline" onClick={addRecoveryItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Substance
                </Button>
              </div>
            )}
          </div>
        </DashboardCard>

        {/* SECTION 6: Mr. PBJ Analytics Settings */}
        <DashboardCard title="Mr. PBJ Analytics Settings">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Control which categories are marked as sensitive and excluded from AI summaries.
            </p>

            {['sleep', 'dreams', 'mood', 'stress', 'calories', 'workouts'].map((category) => {
              const sensitiveKey = `sensitive_${category}` as string;
              const includeKey = `include_${category}_in_summary` as string;
              return (
                <div key={category} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium capitalize">{category}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={edit[sensitiveKey] ?? profile[sensitiveKey] ?? false}
                        onCheckedChange={(checked) => setEdit((x: any) => ({ ...x, [sensitiveKey]: checked }))}
                      />
                      <span className="text-xs text-muted-foreground">Sensitive</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={edit[includeKey] ?? profile[includeKey] ?? true}
                        onCheckedChange={(checked) => setEdit((x: any) => ({ ...x, [includeKey]: checked }))}
                      />
                      <span className="text-xs text-muted-foreground">Include in summaries</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardCard>

        {/* SECTION 7: Notification Settings */}
        <DashboardCard title="Notification Settings">
          <div className="space-y-4">
            {/* Daily Check-in Reminder */}
            <div>
              <Label className="text-base font-semibold">Daily Check-in Reminder</Label>
              <Input
                type="time"
                className="mt-2 w-40"
                defaultValue={profile.checkin_reminder_time || "20:00"}
                onChange={(e) => setEdit((x: any) => ({ ...x, checkin_reminder_time: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                We'll remind you to complete your daily check-in
              </p>
            </div>

            {/* Weekly Summary */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base font-medium">Weekly Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Receive a weekly analytics summary
                </p>
              </div>
              <Switch
                checked={edit.weekly_summary_enabled ?? profile.weekly_summary_enabled ?? true}
                onCheckedChange={(checked) => setEdit((x: any) => ({ ...x, weekly_summary_enabled: checked }))}
              />
            </div>

            {(edit.weekly_summary_enabled ?? profile.weekly_summary_enabled ?? true) && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Day</Label>
                  <Select
                    value={edit.weekly_summary_day ?? profile.weekly_summary_day ?? 'sunday'}
                    onValueChange={(value) => setEdit((x: any) => ({ ...x, weekly_summary_day: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunday">Sunday</SelectItem>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="saturday">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Time</Label>
                  <Input
                    type="time"
                    className="mt-1"
                    defaultValue={profile.weekly_summary_time || "09:00"}
                    onChange={(e) => setEdit((x: any) => ({ ...x, weekly_summary_time: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>
        </DashboardCard>

        {/* Save Button */}
        <Button onClick={save} size="lg" className="w-full" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </Button>

        {/* SECTION: Recent Check-Ins */}
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
                  {checkins.map((c: any) => (
                    <tr
                      key={c.id}
                      className="hover:bg-muted cursor-pointer border-t"
                      onClick={() => window.location.href = `/checkins/${c.for_date}`}
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
            onClick={() => window.location.href = "/checkins/all"}
          >
            View All
          </Button>
        </DashboardCard>
      </div>
    </div>
  );
}
