// PBJ Health - Life Evaluators
// Summarize work, social, hobbies

export function summarizeWork(day: {
  logs: { durationMin: number; stress?: 'low' | 'medium' | 'high' }[];
}): { totalMin: number; peakStress: 'low' | 'medium' | 'high' | null } {
  const total = day.logs.reduce((s, l) => s + (l.durationMin || 0), 0);
  const c = day.logs.reduce(
    (acc, l) => {
      const v = l.stress || 'low';
      acc[v] = (acc[v] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const peak =
    (['high', 'medium', 'low'] as const).find((k) => c[k] && c[k] > 0) || null;

  return { totalMin: total, peakStress: peak };
}

export function topN<T extends { name: string; durationMin?: number }>(
  arr: T[],
  n = 3
): string[] {
  return arr
    .sort((a, b) => (b.durationMin || 0) - (a.durationMin || 0))
    .slice(0, n)
    .map((x) => x.name);
}
