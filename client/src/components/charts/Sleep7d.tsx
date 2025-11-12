// components/charts/Sleep7d.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useSevenDay } from '@/hooks/useSevenDay';

interface Sleep7dProps {
  userId: string;
}

export function Sleep7d({ userId }: Sleep7dProps) {
  const { data, isLoading } = useSevenDay(userId);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-sm text-muted-foreground">No sleep data available</div>;
  }

  const sleepTarget = data[0]?.sleepTarget || 6;
  
  const chartData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    hours: d.sleepHours || 0,
    target: sleepTarget,
    status: (d.sleepHours || 0) >= sleepTarget ? 'Over' : 'Under',
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis fontSize={12} label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
        <Tooltip 
          formatter={(value: any, name: string) => {
            if (name === 'hours') {
              const item = chartData.find(d => d.hours === value);
              return [`${value} h (${item?.status || ''})`, 'Sleep'];
            }
            return value;
          }}
        />
        <ReferenceLine y={sleepTarget} stroke="#10B981" strokeDasharray="3 3" label="Target" />
        <Bar 
          dataKey="hours" 
          fill="#8B5CF6" 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
