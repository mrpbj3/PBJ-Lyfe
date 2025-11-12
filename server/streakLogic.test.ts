// server/streakLogic.test.ts
// Unit tests for streak calculation logic

import {
  hasData,
  getEffectiveColor,
  normalizeDays,
  calculateStreak,
  getStreakFromDailySummary,
  type DailySummaryRow,
  type StreakColor,
} from './streakLogic';

// Test helper to create a daily summary row
function createRow(
  date: string,
  calories_total: number | null = null,
  calorie_target: number | null = null,
  sleep_hours: number | null = null,
  did_workout: boolean | null = null,
  streak_color: StreakColor | null = null
): DailySummaryRow {
  return {
    summary_date: date,
    calories_total,
    calorie_target,
    sleep_hours,
    did_workout,
    streak_color,
  };
}

// Simple test runner for Node.js
let passed = 0;
let failed = 0;

function expect(value: any) {
  return {
    toBe: (expected: any) => {
      if (value !== expected) {
        throw new Error(`Expected ${expected} but got ${value}`);
      }
    },
  };
}

function it(description: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${description}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   ${(error as Error).message}`);
    failed++;
  }
}

function describe(suite: string, fn: () => void) {
  console.log(`\n${suite}:`);
  fn();
}

console.log('Running streak logic tests...\n');

// Test suite
describe('Streak Logic', () => {
  describe('hasData', () => {
    it('should return true when calories are present', () => {
      const row = createRow('2025-01-01', 2000, 2200);
      expect(hasData(row)).toBe(true);
    });

    it('should return true when sleep_hours > 0', () => {
      const row = createRow('2025-01-01', null, null, 7);
      expect(hasData(row)).toBe(true);
    });

    it('should return true when did_workout is true', () => {
      const row = createRow('2025-01-01', null, null, null, true);
      expect(hasData(row)).toBe(true);
    });

    it('should return false when no data present', () => {
      const row = createRow('2025-01-01');
      expect(hasData(row)).toBe(false);
    });

    it('should return false when only calories_total is present', () => {
      const row = createRow('2025-01-01', 2000, null);
      expect(hasData(row)).toBe(false);
    });
  });

  describe('getEffectiveColor', () => {
    it('should return red for days with no data', () => {
      const row = createRow('2025-01-01', null, null, null, null, 'green');
      expect(getEffectiveColor(row)).toBe('red');
    });

    it('should use streak_color when data exists', () => {
      const row = createRow('2025-01-01', 2000, 2200, null, null, 'green');
      expect(getEffectiveColor(row)).toBe('green');
    });

    it('should default to red when streak_color is null but data exists', () => {
      const row = createRow('2025-01-01', 2000, 2200, null, null, null);
      expect(getEffectiveColor(row)).toBe('red');
    });
  });

  describe('calculateStreak', () => {
    it('Case 1: [green, green, yellow] → count 3, color green (most recent)', () => {
      const normalized = [
        { date: '2025-01-03', effectiveColor: 'green' as StreakColor },
        { date: '2025-01-02', effectiveColor: 'green' as StreakColor },
        { date: '2025-01-01', effectiveColor: 'yellow' as StreakColor },
      ];
      const result = calculateStreak(normalized);
      expect(result.count).toBe(3);
      expect(result.color).toBe('green'); // First element is most recent, so green
    });

    it('Case 2: [red, green, green] → count 1, color red (clamped)', () => {
      const normalized = [
        { date: '2025-01-03', effectiveColor: 'red' as StreakColor },
        { date: '2025-01-02', effectiveColor: 'green' as StreakColor },
        { date: '2025-01-01', effectiveColor: 'green' as StreakColor },
      ];
      const result = calculateStreak(normalized);
      expect(result.count).toBe(1); // Clamped to minimum 1
      expect(result.color).toBe('red');
    });

    it('Case 3: [no-data→red, green, yellow] → count 1, color red (clamped)', () => {
      const normalized = [
        { date: '2025-01-03', effectiveColor: 'red' as StreakColor }, // no-data day
        { date: '2025-01-02', effectiveColor: 'green' as StreakColor },
        { date: '2025-01-01', effectiveColor: 'yellow' as StreakColor },
      ];
      const result = calculateStreak(normalized);
      expect(result.count).toBe(1); // Clamped to minimum 1
      expect(result.color).toBe('red');
    });

    it('Case 5: [] (no rows) → count 1, color red', () => {
      const normalized: Array<{ date: string; effectiveColor: StreakColor }> = [];
      const result = calculateStreak(normalized);
      expect(result.count).toBe(1); // Always at least 1
      expect(result.color).toBe('red');
    });

    it('Case 6: [yellow] → count 1, color yellow', () => {
      const normalized = [
        { date: '2025-01-01', effectiveColor: 'yellow' as StreakColor },
      ];
      const result = calculateStreak(normalized);
      expect(result.count).toBe(1);
      expect(result.color).toBe('yellow');
    });

    it('Case 4: [yellow, yellow, red, green] → count 2, color yellow', () => {
      const normalized = [
        { date: '2025-01-04', effectiveColor: 'yellow' as StreakColor },
        { date: '2025-01-03', effectiveColor: 'yellow' as StreakColor },
        { date: '2025-01-02', effectiveColor: 'red' as StreakColor },
        { date: '2025-01-01', effectiveColor: 'green' as StreakColor },
      ];
      const result = calculateStreak(normalized);
      expect(result.count).toBe(2);
      expect(result.color).toBe('yellow');
    });

    it('should handle all green streak', () => {
      const normalized = [
        { date: '2025-01-05', effectiveColor: 'green' as StreakColor },
        { date: '2025-01-04', effectiveColor: 'green' as StreakColor },
        { date: '2025-01-03', effectiveColor: 'green' as StreakColor },
      ];
      const result = calculateStreak(normalized);
      expect(result.count).toBe(3);
      expect(result.color).toBe('green');
    });
  });

  describe('getStreakFromDailySummary', () => {
    it('should handle complete workflow with no-data days', () => {
      const rows = [
        createRow('2025-01-05', 2000, 2200, 7, true, 'green'),
        createRow('2025-01-04', 2100, 2200, 6, false, 'yellow'),
        createRow('2025-01-03', null, null, null, null, null), // no data = red
        createRow('2025-01-02', 2000, 2200, 7, true, 'green'),
      ];
      const result = getStreakFromDailySummary(rows);
      expect(result.count).toBe(2); // Only recent 2 days
      expect(result.color).toBe('green'); // Most recent is green (first row)
    });

    it('should handle all green days', () => {
      const rows = [
        createRow('2025-01-03', 2000, 2200, 7, true, 'green'),
        createRow('2025-01-02', 2100, 2200, 8, true, 'green'),
        createRow('2025-01-01', 1900, 2200, 7, true, 'green'),
      ];
      const result = getStreakFromDailySummary(rows);
      expect(result.count).toBe(3);
      expect(result.color).toBe('green');
    });
  });
});

console.log(`\n\n✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Total: ${passed + failed}\n`);

process.exit(failed > 0 ? 1 : 0);
