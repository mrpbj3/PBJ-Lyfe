// src/pages/onboarding/ProfileOnboarding.tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { toast, useToast } from "@/hooks/use-toast"; // or your Toaster helper

const PBJ_PURPLE = "#AB13E6";
const PBJ_GOLD = "#C38452";

const AVATAR_COLORS = [
  "#AB13E6", "#C38452", "#6C6A76", "#1A1325",
  "#9B0FD1", "#8F89A0", "#3B3348", "#0F0D12",
  "#4E46E5", "#059669", "#EA580C", "#DC2626"
];

export default function ProfileOnboarding() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async (vals: any) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ ...vals, updated_at: new Date().toISOString() })
        .eq("id", user!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(["profile", user?.id], data);
      toast({ title: "Saved", description: "Your profile was updated." });
    },
    onError: (e: any) => {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    },
  });

  const complete = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_onboarding_complete: true })
        .eq("id", user!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => navigate("/today"),
  });

  if (isLoading || !profile) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  }

  // LOCAL FORM STATE (seed from profile)
  const [firstName, setFirstName] = useState(profile.first_name ?? "");
  const [lastName, setLastName]   = useState(profile.last_name ?? "");
  const [initialsColor, setInitialsColor] = useState(profile.initials_color ?? AVATAR_COLORS[0]);
  const [weightUnit, setWeightUnit] = useState(profile.units_weight ?? "lb");
  const [heightUnit, setHeightUnit] = useState(profile.units_height ?? "imperial");
  const [timezone, setTimezone]     = useState(profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [dateFormat, setDateFormat] = useState(profile.date_format ?? "MDY");

  const [calTarget, setCalTarget] = useState<number | undefined>(profile.calorie_target ?? undefined);
  const [stepGoal, setStepGoal]   = useState<number | undefined>(profile.step_goal ?? undefined);
  const [sleepTarget, setSleepTarget] = useState<number | undefined>(profile.sleep_target_minutes ?? 480);
  const [workoutDays, setWorkoutDays] = useState<number | undefined>(profile.workout_days_target ?? 3);

  const [inRecovery, setInRecovery] = useState<boolean>(!!profile.in_recovery);

  const initials = useMemo(() => {
    const f = (firstName || "").trim();
    const l = (lastName || "").trim();
    if (f && l) return (f[0] + l[0]).toUpperCase();
    if (f) return f.slice(0, 2).toUpperCase();
    return "PB";
  }, [firstName, lastName]);

  const save = () =>
    update.mutate({
      first_name: firstName || null,
      last_name: lastName || null,
      initials_color: initialsColor,
      units_weight: weightUnit,
      units_height: heightUnit,
      timezone,
      date_format: dateFormat,
      calorie_target: calTarget ?? null,
      step_goal: stepGoal ?? null,
      sleep_target_minutes: sleepTarget ?? null,
      workout_days_target: workoutDays ?? null,
      in_recovery: inRecovery,
    });

  return (
    <div className="min-h-screen bg-[#F7F5FB]">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-[#EFE8F7]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-extrabold text-xl">
            <span style={{ color: PBJ_PURPLE }}>PBJ</span>
            <span style={{ color: PBJ_GOLD }}> LYFE</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              className="px-4 py-2 rounded-xl border-2"
              style={{ borderColor: PBJ_PURPLE, color: PBJ_PURPLE }}
            >
              Save
            </button>
            <button
              onClick={() => { save(); complete.mutate(); }}
              className="px-4 py-2 rounded-xl text-white"
              style={{ background: PBJ_PURPLE }}
            >
              Save & Continue
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 grid gap-8">
        {/* A) Identity & Appearance */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#EFE8F7] p-6">
          <h2 className="font-bold text-lg mb-4" style={{ color: "#1A1325" }}>Identity & Appearance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-[#6C6A76]">First name</label>
              <input className="w-full rounded-xl border px-3 py-2"
                     value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-[#6C6A76]">Last name</label>
              <input className="w-full rounded-xl border px-3 py-2"
                     value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-[#6C6A76]">Email</label>
              <input className="w-full rounded-xl border px-3 py-2 bg-gray-50"
                     value={profile.email ?? user?.email ?? ""} readOnly />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="rounded-full w-14 h-14 grid place-items-center text-white font-bold"
                 style={{ background: initialsColor }}>
              {initials}
            </div>
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map(c => (
                <button key={c} aria-label={c}
                  onClick={() => setInitialsColor(c)}
                  className={`w-8 h-8 rounded-full border ${c===initialsColor ? "ring-2 ring-offset-2": ""}`}
                  style={{ background: c, borderColor: "#EFE8F7" }} />
              ))}
            </div>
          </div>
        </section>

        {/* B) Accounts & Basics */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#EFE8F7] p-6">
          <h2 className="font-bold text-lg mb-4" style={{ color: "#1A1325" }}>Accounts & Basics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-[#6C6A76]">Weight units</label>
              <select className="w-full rounded-xl border px-3 py-2"
                      value={weightUnit} onChange={e => setWeightUnit(e.target.value)}>
                <option value="lb">lb</option>
                <option value="kg">kg</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-[#6C6A76]">Height units</label>
              <select className="w-full rounded-xl border px-3 py-2"
                      value={heightUnit} onChange={e => setHeightUnit(e.target.value)}>
                <option value="imperial">ft+in</option>
                <option value="metric">cm</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-[#6C6A76]">Timezone</label>
              <input className="w-full rounded-xl border px-3 py-2"
                     value={timezone} onChange={e => setTimezone(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-[#6C6A76]">Date format</label>
              <select className="w-full rounded-xl border px-3 py-2"
                      value={dateFormat} onChange={e => setDateFormat(e.target.value)}>
                <option value="MDY">MM/DD/YYYY</option>
                <option value="DMY">DD/MM/YYYY</option>
              </select>
            </div>
          </div>
        </section>

        {/* C) Goals & Targets */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#EFE8F7] p-6">
          <h2 className="font-bold text-lg mb-4" style={{ color: "#1A1325" }}>Goals & Targets</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <InputNumber label="Calorie target (kcal/day)" value={calTarget} setValue={setCalTarget} />
            <InputNumber label="Step goal (steps/day)" value={stepGoal} setValue={setStepGoal} />
            <InputNumber label="Sleep target (min)" value={sleepTarget} setValue={setSleepTarget} />
            <InputNumber label="Workout days / week" value={workoutDays} setValue={setWorkoutDays} />
          </div>
        </section>

        {/* D) Recovery */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#EFE8F7] p-6">
          <h2 className="font-bold text-lg mb-2" style={{ color: "#1A1325" }}>Recovery & Substance Settings</h2>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={inRecovery} onChange={e => setInRecovery(e.target.checked)} />
            <span>In recovery</span>
          </label>
          <p className="text-sm text-[#6C6A76] mt-2">
            Substances list editor ships next (v1.1). Defaults: <code>is_sensitive=true</code>, <code>include_in_summaries=false</code>.
          </p>
        </section>

        {/* E & F & G — you already have detailed requirements.
            Below I show a small “Preferences” sample row; you can expand with toggles. */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#EFE8F7] p-6">
          <h2 className="font-bold text-lg mb-2" style={{ color: "#1A1325" }}>Notifications</h2>
          <p className="text-sm text-[#6C6A76]">Daily check-in reminders and weekly summary toggles will be added as scheduled jobs (v1.1).</p>
        </section>

        <div className="flex justify-end gap-2">
          <button onClick={save}
                  className="px-4 py-2 rounded-xl border-2"
                  style={{ borderColor: PBJ_PURPLE, color: PBJ_PURPLE }}>
            Save
          </button>
          <button onClick={() => { save(); complete.mutate(); }}
                  className="px-4 py-2 rounded-xl text-white"
                  style={{ background: PBJ_PURPLE }}>
            Save & Continue
          </button>
        </div>
      </main>
    </div>
  );
}

function InputNumber({
  label, value, setValue,
}: { label: string; value?: number; setValue: (v?: number) => void }) {
  return (
    <div>
      <label className="text-sm text-[#6C6A76]">{label}</label>
      <input
        type="number"
        className="w-full rounded-xl border px-3 py-2"
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    </div>
  );
}
