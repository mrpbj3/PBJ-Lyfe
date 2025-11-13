// PBJ Health - Dream Analysis
// AI analysis stub for MVP

export type Dream = {
  title?: string;
  narrative: string;
  tags?: string[];
  emotion?: number;
  intensity?: number;
  dateISO: string;
};

export async function analyzeDreams(
  dreams: Dream[],
  scope: 'single' | 'week'
): Promise<{ summary: string; themes: string[]; advice: string }> {
  const text = dreams.map((d) => d.narrative).join('\n---\n');

  if (!text.trim()) {
    return {
      summary: 'No dream text provided.',
      themes: [],
      advice: 'Add a few details next time.',
    };
  }

  // Simple keyword-based theme detection for MVP
  const themes: string[] = [];
  if (/car|vehicle|crash/i.test(text)) themes.push('travel/safety');
  if (/fall|falling/i.test(text)) themes.push('control/instability');
  if (/chase|run/i.test(text)) themes.push('avoidance/anxiety');
  if (/water|ocean|swim/i.test(text)) themes.push('emotions/flow');
  if (/fly|flying/i.test(text)) themes.push('freedom/ambition');

  const summary = `You logged ${dreams.length} dream(s). Common themes: ${themes.join(', ') || '—'}.`;
  const advice =
    'Wind-down routine: dim lights and 5–10 min breathing before bed.';

  return { summary, themes, advice };
}
