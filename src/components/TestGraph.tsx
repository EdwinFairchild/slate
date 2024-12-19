import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import type { Measurement } from '../types/test';

interface TestGraphProps {
  measurements: Measurement[];
}

export function TestGraph({ measurements }: TestGraphProps) {
  const data = measurements.map(m => ({
    timestamp: new Date(m.timestamp).getTime(),
    value: m.value
  }));

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['auto', 'auto']}
            tickFormatter={(timestamp) => format(timestamp, 'HH:mm:ss')}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(timestamp) => format(new Date(timestamp), 'HH:mm:ss')}
            formatter={(value: number) => [value.toFixed(3), 'Value']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            dot={false}
            name="Measurement"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}