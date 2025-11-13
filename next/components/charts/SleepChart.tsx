// PBJ Health - Sleep 7-Day Bar Chart
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface SleepChartProps {
  userId: string;
  targetHours?: number;
}

export function SleepChart({ userId, targetHours = 6 }: SleepChartProps) {
  const { data: sleepData } = useQuery({
    queryKey: ['sleep-chart', userId],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const { data } = await supabase
        .from('daily_summary')
        .select('summary_date, sleep_hours')
        .eq('user_id', userId)
        .gte('summary_date', startDate.toISOString().split('T')[0])
        .lte('summary_date', endDate.toISOString().split('T')[0])
        .order('summary_date', { ascending: true });

      return (data || []).map(d => ({
        date: new Date(d.summary_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hours: d.sleep_hours || 0,
        target: targetHours,
      }));
    },
    enabled: !!userId,
  });

  if (!sleepData || sleepData.length === 0) {
    return <div className="text-sm text-muted-foreground">No sleep data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={sleepData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis fontSize={12} label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <ReferenceLine y={targetHours} stroke="#10B981" strokeDasharray="3 3" label="Target" />
        <Bar 
          dataKey="hours" 
          fill="#8B5CF6" 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
