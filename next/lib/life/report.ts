// PBJ Health - Lyfe Report Generator
// Generate formatted reports for different time breakdowns

const fmtHM = (m: number) =>
  `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}m`;

export type BreakdownType = 'Previous Day' | '7 Day' | '30 Day' | '3 Month';

export function generateLyfeReport(input: {
  breakdown: BreakdownType;
  streakColor: 'GREEN' | 'YELLOW' | 'RED';
  gymMin: number;
  sleepMin: number;
  calories: {
    intake: number;
    goal: number;
    status: 'UN' | 'OV' | 'GOAL';
    delta: number;
  };
  mental: 'GOOD' | 'OK' | 'BAD';
  meditationMin: number;
  dream: { type?: string; short?: string } | null;
  social: { totalMin: number; activities: string[] };
  hobbies: { totalMin: number; activities: string[] };
  work: { totalMin: number; stress: 'low' | 'medium' | 'high' | null };
  drugs: {
    summary: string;
    withdrawal?: {
      drug: string;
      symptom: string;
      strength: 'low' | 'medium' | 'high';
    } | null;
    recoveryDays?: Record<string, number>;
  };
}): string {
  const L: string[] = [];

  L.push(`Here is ${input.breakdown} Lyfe Report:`);
  L.push(`Streak Status: ${input.streakColor}`);
  L.push(`1. Gym Time: ${fmtHM(input.gymMin)}`);
  L.push(`2. Sleep: ${fmtHM(input.sleepMin)}`);

  const c = input.calories;
  L.push(
    `3. Calories ${c.intake}/${c.goal} ${c.status} ${c.delta >= 0 ? `+${c.delta}` : `${c.delta}`}`
  );

  L.push(`You listed your Mental Health as: ${input.mental}.`);
  L.push(
    `Meditation: ${input.meditationMin > 0 ? fmtHM(input.meditationMin) : 'None'}.`
  );

  if (input.dream) {
    L.push(
      `Dream Analysis: ${input.dream.type || '—'} - ${input.dream.short || '—'}.`
    );
  }

  const s = input.social;
  L.push(
    `Social Presence: You spent, ${fmtHM(s.totalMin)}, being social yesterday:`
  );
  s.activities.slice(0, 3).forEach((a, i) => L.push(`${i + 1}. ${a}`));

  const h = input.hobbies;
  L.push(`Hobbies: You spent, ${fmtHM(h.totalMin)}, doing hobbies.`);
  h.activities.slice(0, 3).forEach((a, i) => L.push(`${i + 1}. ${a}`));

  const w = input.work;
  if (w.totalMin > 0) {
    L.push(
      `Work: You worked for ${Math.round(w.totalMin / 60)} hours and had a ${w.stress ?? '—'} stress day.`
    );
  }

  const d = input.drugs;
  L.push(
    `Drug Use: You consumed; ${d.summary}, yesterday.${d.withdrawal ? ` You also listed your ${d.withdrawal.drug} withdrawal symptoms of "${d.withdrawal.symptom}" as "${d.withdrawal.strength}".` : ''}`
  );

  return L.join('\n');
}
