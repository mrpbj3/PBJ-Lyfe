// PBJ Health - Calculations Library
// BMR, TDEE, EWMA, Epley 1RM, etc.

export interface PersonData {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: 'male' | 'female';
}

/**
 * BMR using Mifflin-St Jeor equation
 * Male: 10 * kg + 6.25 * cm - 5 * age + 5
 * Female: 10 * kg + 6.25 * cm - 5 * age - 161
 */
export function calculateBMR(data: PersonData): number {
  const base = 10 * data.weightKg + 6.25 * data.heightCm - 5 * data.age;
  return data.gender === 'male' ? base + 5 : base - 161;
}

/**
 * TDEE (Total Daily Energy Expenditure)
 * BMR × activity factor (1.2-1.6)
 */
export function calculateTDEE(bmr: number, activityFactor: number): number {
  return Math.round(bmr * activityFactor);
}

/**
 * Adaptive TDEE based on actual weight change
 * TDEE_est = AvgIntake + 3500 × (Δ trend_weight / 7 days)
 */
export function calculateAdaptiveTDEE(
  avgIntake: number,
  trendWeightDeltaKg: number,
  days: number = 7
): number {
  const lbChange = trendWeightDeltaKg * 2.20462; // kg to lbs
  return Math.round(avgIntake + 3500 * (lbChange / days));
}

/**
 * Trend Weight using EWMA (Exponentially Weighted Moving Average)
 * λ = 0.25
 */
export function calculateTrendWeight(
  currentTrend: number,
  newWeight: number,
  lambda: number = 0.25
): number {
  return lambda * newWeight + (1 - lambda) * currentTrend;
}

/**
 * Simple moving average fallback for trend weight
 */
export function calculateMovingAverage(weights: number[]): number {
  if (weights.length === 0) return 0;
  return weights.reduce((sum, w) => sum + w, 0) / weights.length;
}

/**
 * Epley 1RM formula
 * 1RM = weight × (1 + reps / 30)
 */
export function calculateOneRepMax(weight: number, reps: number): number {
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Auto progression logic
 * RIR ≤ 2 → +2.5-5 lb next time
 * RIR ≥ 4 → hold or reduce
 */
export function suggestProgression(
  currentWeight: number,
  lastSetRIR: number
): { weight: number; action: 'increase' | 'maintain' | 'reduce' } {
  if (lastSetRIR <= 2) {
    // Add 2.5-5 lb (1-2.5 kg)
    const increment = currentWeight < 50 ? 1 : 2.5;
    return { weight: currentWeight + increment, action: 'increase' };
  } else if (lastSetRIR >= 4) {
    return { weight: currentWeight, action: 'maintain' };
  }
  return { weight: currentWeight, action: 'maintain' };
}

/**
 * Plateau detection
 * 14 days with ≤ 0.3% body weight change AND adherence ≥ 80%
 */
export function detectPlateau(
  weightChange: number,
  bodyWeight: number,
  days: number,
  adherence: number
): boolean {
  if (days < 14 || adherence < 0.8) return false;
  const percentChange = Math.abs(weightChange / bodyWeight);
  return percentChange <= 0.003; // 0.3%
}

/**
 * Calculate calorie deficit for weight loss goal
 * 1 lb fat = ~3500 kcal
 */
export function calculateDeficit(
  currentWeightKg: number,
  goalWeightKg: number,
  weeksToGoal: number,
  tdee: number
): { dailyDeficit: number; targetKcal: number } {
  const totalLbToLose = (currentWeightKg - goalWeightKg) * 2.20462;
  const totalDeficitNeeded = totalLbToLose * 3500;
  const dailyDeficit = Math.round(totalDeficitNeeded / (weeksToGoal * 7));
  const targetKcal = tdee - dailyDeficit;
  
  return { dailyDeficit, targetKcal };
}

/**
 * Format duration from minutes to h:mm
 */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${String(m).padStart(2, '0')}m`;
}

/**
 * Parse duration string to minutes
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)h(\d+)m?/);
  if (!match) return 0;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}
