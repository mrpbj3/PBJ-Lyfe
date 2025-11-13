// PBJ Health - Streak Badge Component
// Duolingo-style colored badges for daily streaks
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface StreakBadgeProps {
  color: 'green' | 'yellow' | 'red';
  count: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakBadge({ color, count, label, size = 'md' }: StreakBadgeProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-lg',
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const bgClasses = {
    green: 'bg-streak-green text-streak-green-foreground',
    yellow: 'bg-streak-yellow text-streak-yellow-foreground',
    red: 'bg-streak-red text-streak-red-foreground',
  };

  const Icon = color === 'green' ? CheckCircle2 : color === 'yellow' ? AlertTriangle : XCircle;

  return (
    <div className="inline-flex flex-col items-center gap-2" data-testid={`badge-streak-${color}`}>
      <div
        className={`rounded-full flex items-center justify-center font-bold ${sizeClasses[size]} ${bgClasses[color]}`}
      >
        <Icon className={iconSizeClasses[size]} />
      </div>
      <span className="text-sm font-semibold">{count} day{count !== 1 ? 's' : ''}</span>
      {label && (
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
