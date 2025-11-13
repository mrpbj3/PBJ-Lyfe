// lib/units.ts
// Unit conversion utilities

/**
 * Convert kilograms to pounds
 */
export function kgToLb(kg: number): number {
  return kg * 2.20462;
}

/**
 * Convert pounds to kilograms
 */
export function lbToKg(lb: number): number {
  return lb / 2.20462;
}

/**
 * Convert centimeters to inches
 */
export function cmToIn(cm: number): number {
  return cm / 2.54;
}

/**
 * Convert inches to centimeters
 */
export function inToCm(inches: number): number {
  return inches * 2.54;
}

/**
 * Format minutes as hours and minutes
 * @example formatDuration(83) => "1 h 23 m"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${mins} m`;
}
