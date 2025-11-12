// PBJ Health - Nutrition 7-Day Bar Chart
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface NutritionChartProps {
  userId: string;
  targetCalories?: number;
}

export function NutritionChart({ userId, targetCalories = 2000 }: NutritionChartProps) {
  const { data: nutritionData } = useQuery({
    queryKey: ['nutrition-chart', userId],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const { data } = await supabase
        .from('daily_summary')
        .select('summary_date, calories')
        .eq('user_id', userId)
        .gte('summary_date', startDate.toISOString().split('T')[0])
        .lte('summary_date', endDate.toISOString().split('T')[0])
        .order('summary_date', { ascending: true });

      return (data || []).map(d => ({
        date: new Date(d.summary_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        calories: d.calories || 0,
        target: targetCalories,
      }));
    },
    enabled: !!userId,
  });

  if (!nutritionData || nutritionData.length === 0) {
    return <div className="text-sm text-muted-foreground">No nutrition data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={nutritionData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis fontSize={12} label={{ value: 'Calories', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <ReferenceLine y={targetCalories} stroke="#10B981" strokeDasharray="3 3" label="Target" />
        <Bar 
          dataKey="calories" 
          fill="#F59E0B" 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
