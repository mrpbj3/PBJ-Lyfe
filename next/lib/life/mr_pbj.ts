// PBJ Health - Mr. PBJ Coach
// Coaching tips based on daily/weekly data

export async function mrPBJCoach(report: any): Promise<string> {
  const tips: string[] = [];

  // Streak-based tips
  if (report.streakColor === 'GREEN') {
    tips.push('You kept the full streak—awesome consistency!');
  }
  if (report.streakColor === 'YELLOW') {
    tips.push(
      'Solid day: 2/3 pillars. Try a 10‑min walk or lighter dinner to hit 3/3.'
    );
  }
  if (report.streakColor === 'RED') {
    tips.push(
      'Tough day happens. Focus on sleep + one easy win (short workout or mindful meal).'
    );
  }

  // Calorie-based tips
  if (report.calories?.status === 'OV') {
    tips.push(
      'Plan a protein‑forward breakfast and pre‑log dinner to avoid spillover.'
    );
  }

  // Sleep tips
  if (report.sleepMin < 420) {
    tips.push('Aim lights‑out 30–45 min earlier tonight.');
  }

  // Recovery tips
  if (
    report.drugs?.recoveryDays &&
    Object.values(report.drugs.recoveryDays).some((d: any) => d > 0)
  ) {
    tips.push('Proud of your clean streak—keep stacking days.');
  }

  if (report.drugs?.withdrawal?.symptom) {
    tips.push('Try sugar‑free gum or a brief walk when cravings spike.');
  }

  // Dream tips
  if ((report.dream?.type || '').toLowerCase().includes('nightmare')) {
    tips.push('Reduce intense media before bed and try 5‑min breathing.');
  }

  // Meditation tip
  if (report.meditationMin === 0 || !report.meditationMin) {
    tips.push('Even 5 minutes of meditation can help with stress and focus.');
  }

  return tips.join(' ');
}
