// PBJ Health - Streak Counters
// Calculate current streaks from ordered flags

export function currentStreak(flagsDesc: boolean[]): number {
  let n = 0;
  for (const v of flagsDesc) {
    if (!v) break;
    n++;
  }
  return n;
}

export function currentColorStreak(colorsDesc: ('green' | 'yellow' | 'red')[]) {
  let greenOnly = 0;
  let nonRed = 0;

  // Green-only streak
  for (const c of colorsDesc) {
    if (c === 'green') greenOnly++;
    else break;
  }

  // On-track streak (green or yellow)
  for (const c of colorsDesc) {
    if (c !== 'red') nonRed++;
    else break;
  }

  return { greenOnly, nonRed };
}
