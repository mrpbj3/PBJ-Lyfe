// PBJ Health - Streak Evaluator
// Based on specification from documentation
import { DateTime } from 'luxon';

type Tz = string;

export type DailyInputs = {
  tz: Tz;
  dateISO: string;
  kcalGoal: number;
  meals: Array<{ calories: number }>;
  sleepSessionsEndingToday: Array<{ startAt: string; endAt: string }>;
  workouts: Array<{ startAt?: string; endAt?: string; durationMin?: number }>;
};

export type DailyResult = {
  dateISO: string;
  sleepMin: number;
  sleepOk: boolean;
  kcalIntake: number;
  kcalGoal: number;
  kcalDelta: number;
  kcalStatus: 'UN' | 'OV' | 'GOAL';
  kcalOk: boolean;
  gymOk: boolean;
  gymStartAt?: string;
  gymEndAt?: string;
  gymDurationMin: number;
  scoreSmall: 0 | 1 | 2 | 3;
  color: 'green' | 'yellow' | 'red';
  caloriesChip: string;
  sleepChip: string;
  gymChip: string;
};

const fmtHM = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h${String(mm).padStart(2, '0')}m`;
};

export function evaluateDaily(inputs: DailyInputs): DailyResult {
  const { tz, dateISO, kcalGoal } = inputs;

  // Calculate calories
  const kcalIntake = Math.max(
    0,
    Math.round(inputs.meals.reduce((s, m) => s + (m.calories || 0), 0))
  );
  const kcalDelta = kcalIntake - kcalGoal;
  let kcalStatus: 'UN' | 'OV' | 'GOAL' =
    kcalDelta < 0 ? 'UN' : kcalDelta > 0 ? 'OV' : 'GOAL';
  const kcalOk = kcalIntake <= kcalGoal;

  // Calculate sleep (sessions that END today)
  const sleepMin = Math.round(
    inputs.sleepSessionsEndingToday.reduce((sum, s) => {
      const start = DateTime.fromISO(s.startAt).setZone(tz);
      const end = DateTime.fromISO(s.endAt).setZone(tz);
      return sum + Math.max(0, end.diff(start, 'minutes').minutes);
    }, 0)
  );
  const sleepOk = sleepMin >= 360; // ≥ 6 hours

  // Calculate gym duration
  let gymDuration = 0;
  let firstStart: DateTime | undefined;
  let lastEnd: DateTime | undefined;
  const dayStart = DateTime.fromISO(dateISO, { zone: tz }).startOf('day');
  const dayEnd = dayStart.endOf('day');

  inputs.workouts.forEach((w) => {
    let mins = w.durationMin ?? 0;
    const ws = w.startAt ? DateTime.fromISO(w.startAt).setZone(tz) : undefined;
    const we = w.endAt ? DateTime.fromISO(w.endAt).setZone(tz) : undefined;

    if (ws && we) {
      const cs = ws < dayStart ? dayStart : ws;
      const ce = we > dayEnd ? dayEnd : we;
      mins = Math.max(0, ce.diff(cs, 'minutes').minutes);
      firstStart = firstStart ? (ws < firstStart ? ws : firstStart) : ws;
      lastEnd = lastEnd ? (we > lastEnd ? we : lastEnd) : we;
    }
    gymDuration += Math.round(Math.max(0, mins));
  });

  const gymOk = gymDuration > 0;

  // Calculate score and color
  const score = ((sleepOk ? 1 : 0) +
    (kcalOk ? 1 : 0) +
    (gymOk ? 1 : 0)) as 0 | 1 | 2 | 3;
  const color: 'green' | 'yellow' | 'red' =
    score === 3 ? 'green' : score === 2 ? 'yellow' : 'red';

  // Format chips (exact format from spec)
  const caloriesChip = `${kcalIntake}/${kcalGoal} ${kcalStatus} ${kcalDelta === 0 ? '0' : kcalDelta > 0 ? `+${kcalDelta}` : `${kcalDelta}`}`;
  const sleepChip = `${fmtHM(sleepMin)} ${sleepOk ? '✅' : '❌'}`;
  const gymChip = gymOk
    ? `✅ ${fmtHM(gymDuration)}${firstStart && lastEnd ? ` (${firstStart.toFormat('t')}–${lastEnd.toFormat('t')})` : ''}`
    : '❌';

  return {
    dateISO,
    sleepMin,
    sleepOk,
    kcalIntake,
    kcalGoal,
    kcalDelta,
    kcalStatus,
    kcalOk,
    gymOk,
    gymStartAt: firstStart?.toISO(),
    gymEndAt: lastEnd?.toISO(),
    gymDurationMin: Math.round(gymDuration),
    scoreSmall: score,
    color,
    caloriesChip,
    sleepChip,
    gymChip,
  };
}
