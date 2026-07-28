"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ThroughputPoint {
  key: string;
  day: string;
  opened: number;
  closed: number;
}

interface ThroughputChartProps {
  data: ThroughputPoint[];
}

export function ThroughputChart({ data }: ThroughputChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="var(--gray-200)" 
          vertical={false}
        />
        <XAxis 
          dataKey="day" 
          stroke="var(--gray-500)"
          style={{ fontSize: "12px" }}
        />
        <YAxis 
          stroke="var(--gray-500)"
          style={{ fontSize: "12px" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid var(--gray-200)",
            borderRadius: "var(--radius)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
          labelStyle={{ color: "var(--gray-900)" }}
        />
        <Legend 
          wrapperStyle={{ paddingTop: "16px" }}
          iconType="square"
        />
        <Bar 
          dataKey="opened" 
          fill="var(--gray-300)" 
          name="Opened"
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          dataKey="closed" 
          fill="var(--green-500)" 
          name="Completed"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
