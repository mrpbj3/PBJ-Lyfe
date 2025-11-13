// PBJ Health - Status Chip Component
// Monospace chips for calories, sleep, gym status
import { Badge } from '@/components/ui/badge';

interface StatusChipProps {
  type: 'calories' | 'sleep' | 'gym';
  text: string;
  testId?: string;
}

export function StatusChip({ type, text, testId }: StatusChipProps) {
  return (
    <Badge
      variant="secondary"
      className="font-mono text-sm px-3 py-1 rounded-full"
      data-testid={testId || `chip-${type}`}
    >
      {text}
    </Badge>
  );
}
