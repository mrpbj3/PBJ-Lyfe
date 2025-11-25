// components/Workouts7dTable.tsx
import { useSevenDay } from '@/hooks/useSevenDay';
import { formatDuration } from '@/lib/units';
import { Link } from 'wouter';

interface Workouts7dTableProps {
  userId: string;
}

export function Workouts7dTable({ userId }: Workouts7dTableProps) {
  const { data, isLoading } = useSevenDay(userId);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-sm text-muted-foreground">No workout data available</div>;
  }

  // Filter to only show days with workouts
  const workoutDays = data.filter(d => d.workoutMin > 0);

  if (workoutDays.length === 0) {
    return <div className="text-sm text-muted-foreground">No workouts logged in the last 7 days</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-accent">
          <tr>
            <th className="text-left p-3">Date</th>
            <th className="text-right p-3">Workout Length</th>
          </tr>
        </thead>
        <tbody>
          {workoutDays.map((day, idx) => (
            <tr key={idx} className="border-t hover:bg-muted cursor-pointer">
              <td className="p-3">
                <Link href={`/workouts/${day.date}`}>
                  <span className="hover:underline text-primary">
                    {new Date(day.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </Link>
              </td>
              <td className="p-3 text-right">{formatDuration(day.workoutMin)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
