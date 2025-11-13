// components/charts/Nutrition7d.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useSevenDay } from '@/hooks/useSevenDay';

interface Nutrition7dProps {
  userId: string;
}

export function Nutrition7d({ userId }: Nutrition7dProps) {
  const { data, isLoading } = useSevenDay(userId);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-sm text-muted-foreground">No nutrition data available</div>;
  }

  const kcalTarget = data[0]?.kcalTarget || 2000;

  const chartData = data.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    calories: d.calories || 0,
    target: kcalTarget,
    status: (d.calories || 0) <= kcalTarget ? 'Under' : 'Over',
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis fontSize={12} label={{ value: 'Calories', angle: -90, position: 'insideLeft' }} />
        <Tooltip 
          formatter={(value: any, name: string) => {
            if (name === 'calories') {
              const item = chartData.find(d => d.calories === value);
              return [`${value} cal (${item?.status || ''})`, 'Intake'];
            }
            return value;
          }}
        />
        <ReferenceLine y={kcalTarget} stroke="#10B981" strokeDasharray="3 3" label="Target" />
        <Bar 
          dataKey="calories" 
          fill="#F59E0B" 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
