// server/streakLogic.ts
// Streak calculation logic with proper handling of no-data days

export type StreakColor = 'green' | 'yellow' | 'red';

export interface DailySummaryRow {
  summary_date: string;
  calories_total: number | null;
  calorie_target: number | null;
  sleep_hours: number | null;
  did_workout: boolean | null;
  streak_color: StreakColor | null;
}

export interface NormalizedDay {
  date: string;
  effectiveColor: StreakColor;
}

export interface StreakResult {
  count: number;
  color: StreakColor;
}

/**
 * Determines if a day has any tracked data
 * A day has data if ANY of:
 * - calories_total and calorie_target are both not null
 * - sleep_hours > 0
 * - did_workout = true
 */
export function hasData(row: DailySummaryRow): boolean {
  return (
    ((row.calories_total != null) && (row.calorie_target != null)) ||
    ((row.sleep_hours != null) && row.sleep_hours > 0) ||
    (row.did_workout === true)
  );
}

/**
 * Calculates the effective color for a day
 * - If day has no data, it's RED (breaks streak)
 * - Otherwise, use the streak_color from the row, defaulting to RED if null
 */
export function getEffectiveColor(row: DailySummaryRow): StreakColor {
  if (!hasData(row)) {
    return 'red';
  }
  return row.streak_color ?? 'red';
}

/**
 * Normalizes daily summary rows into simplified format
 */
export function normalizeDays(rows: DailySummaryRow[]): NormalizedDay[] {
  return rows.map((row) => ({
    date: row.summary_date,
    effectiveColor: getEffectiveColor(row),
  }));
}

/**
 * Calculates streak from normalized days
 * Walks from most recent → older until hitting a RED day
 * Returns count of consecutive non-red days and the most recent non-red color
 */
export function calculateStreak(normalized: NormalizedDay[]): StreakResult {
  let count = 0;
  let lastColor: StreakColor = 'red';

  for (const day of normalized) {
    if (day.effectiveColor === 'red') {
      break;
    }
    count++;
    lastColor = day.effectiveColor;
  }

  return { count, color: lastColor };
}

/**
 * Main function to calculate streak from daily summary data
 */
export function getStreakFromDailySummary(rows: DailySummaryRow[]): StreakResult {
  const normalized = normalizeDays(rows);
  return calculateStreak(normalized);
}
