// components/charts/Weight7d.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSevenDay } from '@/hooks/useSevenDay';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { kgToLb } from '@/lib/units';

interface Weight7dProps {
  userId: string;
}

export function Weight7d({ userId }: Weight7dProps) {
  const { data, isLoading } = useSevenDay(userId);

  // Get user's preferred units
  const { data: profile } = useQuery({
    queryKey: ['profile-units', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('units_weight')
        .eq('id', userId)
        .single();
      return data;
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-sm text-muted-foreground">No weight data available</div>;
  }

  const useImperial = profile?.units_weight === 'lb' || profile?.units_weight === 'lbs';
  const unit = useImperial ? 'lbs' : 'kg';

  const chartData = data
    .filter(d => d.weightKg !== null)
    .map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: useImperial ? kgToLb(d.weightKg!) : d.weightKg!,
    }));

  if (chartData.length === 0) {
    return <div className="text-sm text-muted-foreground">No weight data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis fontSize={12} label={{ value: `Weight (${unit})`, angle: -90, position: 'insideLeft' }} />
        <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)} ${unit}`, 'Weight']} />
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
