import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

/* PBJ colorway */
const PBJ_PRIMARY = "#AB13E6";
const PROFILE_COLORS = ["#AB13E6", "#C38452", "#6EE7B7", "#60A5FA", "#F97316", "#F472B6", "#A78BFA", "#34D399", "#FB7185", "#FBBF24"];

/* simple SHA-256 for passcode hashing (client-side) */
async function hashPasscode(pass: string) {
  const enc = new TextEncoder();
  const data = enc.encode(pass);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function ProfileSetup() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileColor, setProfileColor] = useState(PROFILE_COLORS[0]);

  // Accounts & Basics
  const [unitsWeight, setUnitsWeight] = useState<"lb" | "kg">("kg");
  const [unitsHeight, setUnitsHeight] = useState<"ftin" | "cm">("cm");

  // Goals
  const [calorieTarget, setCalorieTarget] = useState<number | "">("");
  const [workoutDaysTarget, setWorkoutDaysTarget] = useState<number | "">("");

  // Drug Use (prescribed is top-level)
  const [prescribed, setPrescribed] = useState<boolean | null>(null);
  const [inRecovery, setInRecovery] = useState(false);
  const [recoveryList, setRecoveryList] = useState<
    { id: string; name: string; start_date?: string; track_withdrawal?: boolean }[]
  >([]);

  // Privacy and analytics
  const [passcode, setPasscode] = useState("");
  const [passcodeLocked, setPasscodeLocked] = useState(true);
  const [sensitive, setSensitive] = useState({
    drug_use_sensitive: true,
    dreams_sensitive: true,
    mood_why_sensitive: true,
    hobbies_sensitive: true,
    social_sensitive: true,
  });
  const [analytics, setAnalytics] = useState({
    use_mood: true,
    use_stress: true,
    use_calories: true,
    use_workouts: true,
    use_steps: true,
    use_social: true,
    use_dreams: true,
    use_drug_use: true,
  });

  const [dailyCheckinTime, setDailyCheckinTime] = useState<string | null>(null);

  // UI state
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing values (profiles, privacy_prefs, recovery_substances)
  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("first_name,last_name,profile_color,units_weight,units_height,calorie_target,workout_days_target,in_recovery,passcode_hash,daily_checkin_time")
          .eq("id", user.id)
          .maybeSingle();

        if (data) {
          setFirstName(data.first_name ?? "");
          setLastName(data.last_name ?? "");
          setProfileColor(data.profile_color ?? PROFILE_COLORS[0]);
          setUnitsWeight((data.units_weight as "lb" | "kg") ?? "kg");
          setUnitsHeight((data.units_height as "ftin" | "cm") ?? "cm");
          setCalorieTarget(data.calorie_target ?? "");
          setWorkoutDaysTarget(data.workout_days_target ?? "");
          setInRecovery(Boolean(data.in_recovery));
          setDailyCheckinTime(data.daily_checkin_time ?? null);
        }

        const { data: prefs } = await supabase.from("privacy_prefs").select("*").eq("user_id", user.id).maybeSingle();
        if (prefs) {
          setSensitive({
            drug_use_sensitive: prefs.drug_use_sensitive ?? true,
            dreams_sensitive: prefs.dreams_sensitive ?? true,
            mood_why_sensitive: prefs.mood_why_sensitive ?? true,
            hobbies_sensitive: prefs.hobbies_sensitive ?? true,
            social_sensitive: prefs.social_sensitive ?? true,
          });
          setAnalytics({
            use_mood: prefs.use_mood ?? true,
            use_stress: prefs.use_stress ?? true,
            use_calories: prefs.use_calories ?? true,
            use_workouts: prefs.use_workouts ?? true,
            use_steps: prefs.use_steps ?? true,
            use_social: prefs.use_social ?? true,
            use_dreams: prefs.use_dreams ?? true,
            use_drug_use: prefs.use_drug_use ?? true,
          });
          // read prescribed if stored there
          if (typeof prefs.prescribed !== "undefined") setPrescribed(Boolean(prefs.prescribed));
        }

        const { data: recs } = await supabase.from("recovery_substances").select("id,name,start_date,track_withdrawal").eq("user_id", user.id);
        if (recs && Array.isArray(recs)) {
          setRecoveryList(recs.map((r: any) => ({ id: r.id, name: r.name, start_date: r.start_date, track_withdrawal: !!r.track_withdrawal })));
        }
      } catch (err) {
        console.error("load onboarding", err);
      }
    })();
  }, [authLoading, user]);

  // mark dirty when fields change
  useEffect(() => {
    setIsDirty(true);
  }, [firstName, lastName, profileColor, unitsWeight, unitsHeight, calorieTarget, workoutDaysTarget, prescribed, inRecovery, recoveryList, passcode, sensitive, analytics, dailyCheckinTime]);

  // beforeunload guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Save everything in one mutation
  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      if (!user) throw new Error("No user");

      let passcode_hash: string | undefined = undefined;
      if (payload.passcode && payload.passcode.length >= 4) passcode_hash = await hashPasscode(payload.passcode);

      const profilesPayload: any = {
        id: user.id,
        first_name: payload.first_name,
        last_name: payload.last_name,
        profile_color: payload.profile_color,
        units_weight: payload.units_weight,
        units_height: payload.units_height,
        calorie_target: payload.calorie_target,
        workout_days_target: payload.workout_days_target,
        in_recovery: payload.in_recovery,
        passcode_hash: passcode_hash ?? null,
        daily_checkin_time: payload.daily_checkin_time ?? null,
      };

      // upsert profiles (defensive: retry without daily_checkin_time if DB lacks it)
      try {
        const { error } = await supabase.from("profiles").upsert(profilesPayload, { onConflict: "id" });
        if (error) throw error;
      } catch (err: any) {
        const msg = String(err?.message ?? "");
        if (/daily_checkin_time/i.test(msg)) {
          delete profilesPayload.daily_checkin_time;
          const { error: e2 } = await supabase.from("profiles").upsert(profilesPayload, { onConflict: "id" });
          if (e2) throw e2;
        } else {
          throw err;
        }
      }

      // upsert privacy_prefs (merge sensitive + analytics + prescribed)
      const { error: prefsErr } = await supabase.from("privacy_prefs").upsert(
        { user_id: user.id, prescribed: payload.prescribed ?? false, ...payload.privacy_prefs, ...payload.analytics_prefs },
        { onConflict: "user_id" }
      );
      if (prefsErr) throw prefsErr;

      // replace recovery_substances
      const { error: deleteErr } = await supabase.from("recovery_substances").delete().eq("user_id", user.id);
      if (deleteErr) throw deleteErr;

      if (payload.recovery_list && payload.recovery_list.length) {
        const toInsert = payload.recovery_list.map((r: any) => ({
          user_id: user.id,
          name: r.name,
          start_date: r.start_date || null,
          track_withdrawal: r.track_withdrawal || false,
        }));
        const { error: insertErr } = await supabase.from("recovery_substances").insert(toInsert);
        if (insertErr) throw insertErr;
      }

      return true;
    },
    onSuccess: () => {
      setIsDirty(false);
      qc.invalidateQueries({ queryKey: ["/client/profile"] });
      toast({ title: "✅ Saved!", description: "Profile saved." });
    },
    onError: (err: any) => {
      toast({ title: "Error saving", description: err?.message ?? String(err), variant: "destructive" });
    },
  });

  async function handleSaveProfile() {
    if (!firstName.trim() || !lastName.trim() || prescribed === null) {
      toast({ title: "Missing required answers", description: "Please provide first name, last name and answer Prescribed.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await mutation.mutateAsync({
        first_name: firstName,
        last_name: lastName,
        profile_color: profileColor,
        units_weight: unitsWeight,
        units_height: unitsHeight,
        calorie_target: calorieTarget || null,
        workout_days_target: workoutDaysTarget || null,
        in_recovery: inRecovery,
        passcode: passcode,
        privacy_prefs: sensitive,
        analytics_prefs: analytics,
        recovery_list: recoveryList,
        daily_checkin_time: dailyCheckinTime,
        prescribed,
      });

      navigate("/today", { replace: true });
    } catch (err) {
      // mutation onError will show toast
    } finally {
      setSaving(false);
    }
  }

  // recovery helpers
  function addRecoveryItem() { setRecoveryList((s) => [...s, { id: `${Date.now()}`, name: "", start_date: "", track_withdrawal: false }]); }
  function updateRecoveryItem(id: string, changes: Partial<any>) { setRecoveryList((s) => s.map((r) => (r.id === id ? { ...r, ...changes } : r))); }
  function removeRecoveryItem(id: string) { setRecoveryList((s) => s.filter((r) => r.id !== id)); }

  // redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true });
  }, [authLoading, user, navigate]);

  const email = user?.email ?? "";
  const savingText = saving ? "Saving profile…" : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold">Profile Setup</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <section>
          <h2 className="text-3xl font-bold mb-2">Welcome — set up your profile</h2>
          <p className="text-muted-foreground mb-4">Please complete your profile to continue — this is required.</p>
        </section>

        {/* Identity & Appearance */}
        <section className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Identity & Appearance</h3>
            <div className="text-sm text-muted-foreground">{savingText}</div>
          </div>

          <div className="grid gap-4">
            <div>
              <Label>First name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" required />
            </div>

            <div>
              <Label>Last name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" required />
            </div>

            <div>
              <Label>Profile color</Label>
              <div className="flex gap-3 mt-2 flex-wrap">
                {PROFILE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setProfileColor(c)}
                    aria-label={`Select color ${c}`}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      background: c,
                      boxShadow: profileColor === c ? `0 0 0 4px ${PBJ_PRIMARY}33` : undefined,
                      border: profileColor === c ? `2px solid ${PBJ_PRIMARY}` : "1px solid #eee",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Accounts & Basics */}
        <section className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Accounts & Basics</h3>
          <div className="grid gap-4">
            <div>
              <Label>Email</Label>
              <Input value={email} readOnly />
            </div>

            <div>
              <Label>Weight units</Label>
              <select value={unitsWeight} onChange={(e) => setUnitsWeight(e.target.value as "lb" | "kg")} className="w-full rounded border px-3 py-2">
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>

            <div>
              <Label>Height units</Label>
              <select value={unitsHeight} onChange={(e) => setUnitsHeight(e.target.value as "ftin" | "cm")} className="w-full rounded border px-3 py-2">
                <option value="cm">cm</option>
                <option value="ftin">ft + in</option>
              </select>
            </div>
          </div>
        </section>

        {/* Goals & Targets */}
        <section className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Goals & Targets</h3>
          <div className="grid gap-4">
            <div>
              <Label>Daily calorie target (kcal)</Label>
              <Input type="number" value={calorieTarget ?? ""} onChange={(e) => setCalorieTarget(e.target.value === "" ? "" : parseInt(e.target.value))} placeholder="2000" />
            </div>
            <div>
              <Label>Workout days target (days/week)</Label>
              <Input type="number" value={workoutDaysTarget ?? ""} onChange={(e) => setWorkoutDaysTarget(e.target.value === "" ? "" : parseInt(e.target.value))} placeholder="3" />
            </div>
          </div>
        </section>

        {/* Drug Use */}
        <section className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Drug Use</h3>

          <div className="mb-4">
            <Label>Prescribed?</Label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2"><input type="radio" name="prescribed" checked={prescribed === true} onChange={() => setPrescribed(true)} /> <span>Yes</span></label>
              <label className="flex items-center gap-2"><input type="radio" name="prescribed" checked={prescribed === false} onChange={() => setPrescribed(false)} /> <span>No</span></label>
            </div>
          </div>

          <div className="mb-4">
            <Label>In recovery?</Label>
            <div className="mt-2"><Switch checked={inRecovery} onCheckedChange={(v) => setInRecovery(Boolean(v))} /></div>
          </div>

          {inRecovery && (
            <div className="space-y-4">
              {recoveryList.map((r) => (
                <div key={r.id} className="p-3 border rounded">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div><Label>Name</Label><Input value={r.name} onChange={(e) => updateRecoveryItem(r.id, { name: e.target.value })} /></div>
                    <div><Label>Start date</Label><Input type="date" value={r.start_date ?? ""} onChange={(e) => updateRecoveryItem(r.id, { start_date: e.target.value })} /></div>
                    <div><Label>Track withdrawal?</Label><div className="mt-2"><Switch checked={!!r.track_withdrawal} onCheckedChange={(v) => updateRecoveryItem(r.id, { track_withdrawal: Boolean(v) })} /></div></div>
                  </div>
                  <div className="mt-2 flex justify-end"><Button variant="ghost" onClick={() => removeRecoveryItem(r.id)}>Remove</Button></div>
                </div>
              ))}
              <div><Button onClick={addRecoveryItem} style={{ background: PBJ_PRIMARY, color: "white" }}>Add substance</Button></div>
            </div>
          )}
        </section>

        {/* Privacy & Analytics */}
        <section className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Privacy & Analytics</h3>

          <div className="grid gap-4">
            <div>
              <Label>Passcode (4–6 digits) — required to unlock sensitive toggles</Label>
              <Input value={passcode} onChange={(e) => { const digits = e.target.value.replace(/\D/g, "").slice(0,6); setPasscode(digits); if (digits.length >= 4) setPasscodeLocked(false); }} placeholder="Enter 4–6 digit passcode" />
            </div>

            <div>
              <Label>Sensitive categories (locked until passcode entered)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">{Object.entries(sensitive).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border rounded p-3">
                  <span className="capitalize">{k.replace(/_/g, " ")}</span>
                  <Switch checked={v} disabled={passcodeLocked} onCheckedChange={(val) => setSensitive((s) => ({ ...s, [k]: Boolean(val) }))} />
                </div>
              ))}</div>
            </div>

            <div>
              <Label>Analytics preferences</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">{Object.entries(analytics).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border rounded p-3">
                  <span className="capitalize">{k.replace(/_/g, " ")}</span>
                  <Switch checked={v} onCheckedChange={(val) => setAnalytics((s) => ({ ...s, [k]: Boolean(val) }))} />
                </div>
              ))}</div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Notifications</h3>
          <div><Label>Daily check-in time (optional)</Label><Input type="time" value={dailyCheckinTime ?? ""} onChange={(e) => setDailyCheckinTime(e.target.value || null)} /></div>
        </section>

        {/* Actions */}
        <section className="flex justify-end gap-4">
          <Button onClick={handleSaveProfile} style={{ background: PBJ_PRIMARY, color: "white" }} disabled={saving || mutation.isLoading} data-testid="save-profile">
            {saving || mutation.isLoading ? "Saving…" : "Save Profile"}
          </Button>
        </section>
      </main>
    </div>
  );
}
