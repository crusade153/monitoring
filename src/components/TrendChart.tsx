'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PricePoint } from '@/lib/types';

interface Props {
  data: PricePoint[];
  color: string;
}

export default function TrendChart({ data, color }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="#1d2533" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d: string) => d.slice(5)}
          tick={{ fill: '#8b95a7', fontSize: 11 }}
          axisLine={{ stroke: '#1d2533' }}
          tickLine={false}
          minTickGap={28}
        />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fill: '#8b95a7', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={56}
          tickFormatter={(v: number) => v.toLocaleString('en-US')}
        />
        <Tooltip
          contentStyle={{
            background: '#11161f',
            border: '1px solid #1d2533',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: '#8b95a7' }}
          itemStyle={{ color: '#e6edf3' }}
          formatter={(v) => [
            Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 }),
            '',
          ]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
