// Date utilities for PBJ Health
import { DateTime } from 'luxon';

export function getTodayISO(tz: string = 'America/New_York'): string {
  return DateTime.now().setZone(tz).toISODate() || '';
}

export function getYesterdayISO(tz: string = 'America/New_York'): string {
  return DateTime.now().setZone(tz).minus({ days: 1 }).toISODate() || '';
}

export function formatDate(dateStr: string, tz: string = 'America/New_York'): string {
  const dt = DateTime.fromISO(dateStr).setZone(tz);
  return dt.toFormat('MMM d, yyyy');
}

export function formatTime(timestamp: string, tz: string = 'America/New_York'): string {
  const dt = DateTime.fromISO(timestamp).setZone(tz);
  return dt.toFormat('h:mm a');
}

export function formatDateTime(timestamp: string, tz: string = 'America/New_York'): string {
  const dt = DateTime.fromISO(timestamp).setZone(tz);
  return dt.toFormat('MMM d, h:mm a');
}

export function getDateRange(days: number, tz: string = 'America/New_York'): string[] {
  const today = DateTime.now().setZone(tz);
  const dates: string[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    dates.push(today.minus({ days: i }).toISODate() || '');
  }
  
  return dates;
}
