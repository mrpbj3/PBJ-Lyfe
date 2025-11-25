// DateSelector - Sticky date selector for all tracking pages
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getTodayISO } from '@/lib/dateUtils';

interface DateSelectorProps {
  date: string;
  onDateChange: (date: string) => void;
}

export function DateSelector({ date, onDateChange }: DateSelectorProps) {
  const today = getTodayISO();

  const handlePrevDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().split('T')[0];
    // Don't allow going past today
    if (next <= today) {
      onDateChange(next);
    }
  };

  const handleToday = () => {
    onDateChange(today);
  };

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isToday = date === today;

  return (
    <div className="sticky top-[73px] z-40 bg-background/95 backdrop-blur border-b py-3 mb-6">
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevDay}
          aria-label="Previous day"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            max={today}
            className="w-auto"
          />
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {formatDisplayDate(date)}
          </span>
          {isToday && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
              Today
            </span>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextDay}
          disabled={isToday}
          aria-label="Next day"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {!isToday && (
          <Button variant="ghost" size="sm" onClick={handleToday}>
            Today
          </Button>
        )}
      </div>
    </div>
  );
}
