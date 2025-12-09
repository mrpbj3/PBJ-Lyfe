"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import { useSevenDay } from '@/hooks/useSevenDay';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { kgToLb } from '@/lib/units';

interface Weight7dProps {
  userId: string;
}

export function Weight7d({ userId }: Weight7dProps) {
  const { data, isLoading } = useSevenDay(userId);

  // Fetch preferred units
  const { data: profile } = useQuery({
    queryKey: ["profile-units", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("units_weight")
        .eq("id", userId)
        .single();

      return data;
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  // Always show all 7 days
  if (!data || data.length === 0) {
    return <div className="text-sm text-muted-foreground">No weight data available</div>;
  }

  const useImperial = profile?.units_weight === "lb" || profile?.units_weight === "lbs";
  const unit = useImperial ? "lbs" : "kg";

  // Map all 7 days, showing null for days without weight data
  const chartData = data.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    weight: d.weightKg !== null ? (useImperial ? kgToLb(d.weightKg) : d.weightKg) : null,
  }));

  // Check if there's any weight data at all
  const hasWeightData = chartData.some(d => d.weight !== null);
  
  if (!hasWeightData) {
    return <div className="text-sm text-muted-foreground">No weight data available - log your weight to see trends</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis
          fontSize={12}
          domain={['auto', 'auto']}
          label={{
            value: `Weight (${unit})`,
            angle: -90,
            position: "insideLeft",
          }}
        />

        <Tooltip formatter={(value: any) => value !== null ? [`${Number(value).toFixed(1)} ${unit}`, "Weight"] : ["No data", "Weight"]} />

        <Line
          type="monotone"
          dataKey="weight"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={{ fill: "#3B82F6", r: 4 }}
          connectNulls={true}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
