// PBJ Health - Weight 7-Day Line Chart
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface WeightChartProps {
  userId: string;
}

export function WeightChart({ userId }: WeightChartProps) {
  const { data: weightData } = useQuery({
    queryKey: ['weight-chart', userId],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const { data } = await supabase
        .from('body_metrics')
        .select('date, weight_kg')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      return (data || []).map(d => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: d.weight_kg ? parseFloat(d.weight_kg as string) * 2.20462 : 0, // Convert kg to lbs
      }));
    },
    enabled: !!userId,
  });

  if (!weightData || weightData.length === 0) {
    return <div className="text-sm text-muted-foreground">No weight data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={weightData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis fontSize={12} label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey="weight" 
          stroke="#3B82F6" 
          strokeWidth={2}
          dot={{ fill: '#3B82F6', r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
