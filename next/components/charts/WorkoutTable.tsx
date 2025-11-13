// PBJ Health - Workout 7-Day Table
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface WorkoutTableProps {
  userId: string;
}

export function WorkoutTable({ userId }: WorkoutTableProps) {
  const { data: workoutData } = useQuery({
    queryKey: ['workout-table', userId],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const { data } = await supabase
        .from('workouts')
        .select('date, duration_min, exercises')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      return (data || []).map(d => ({
        date: new Date(d.date).toLocaleDateString('en-US', { 
          weekday: 'short',
          month: 'short', 
          day: 'numeric' 
        }),
        duration: d.duration_min || 0,
        exercises: d.exercises?.length || 0,
      }));
    },
    enabled: !!userId,
  });

  if (!workoutData || workoutData.length === 0) {
    return <div className="text-sm text-muted-foreground">No workout data available</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-accent">
          <tr>
            <th className="text-left p-3">Date</th>
            <th className="text-right p-3">Duration</th>
            <th className="text-right p-3">Exercises</th>
          </tr>
        </thead>
        <tbody>
          {workoutData.map((workout, idx) => (
            <tr key={idx} className="border-t hover:bg-muted">
              <td className="p-3">{workout.date}</td>
              <td className="p-3 text-right">{workout.duration} min</td>
              <td className="p-3 text-right">{workout.exercises}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
