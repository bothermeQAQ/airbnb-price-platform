'use client';

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import type { Driver } from '@/lib/predict';

export function DriversChart({ drivers }: { drivers: Driver[] }) {
  const max = Math.max(...drivers.map((d) => Math.abs(d.value)), 10);
  const height = Math.max(drivers.length * 46 + 16, 140);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={drivers}
          layout="vertical"
          margin={{ top: 4, right: 52, bottom: 4, left: 8 }}
        >
          <XAxis type="number" hide domain={[-max * 1.25, max * 1.25]} />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: '#d4d4d8', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={142}
          />
          <ReferenceLine x={0} stroke="rgba(255,255,255,0.16)" />
          <Bar dataKey="value" radius={4} barSize={18}>
            {drivers.map((d, i) => (
              <Cell key={i} fill={d.value >= 0 ? '#10b981' : '#fb7185'} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(v: number) =>
                `${v >= 0 ? '+' : '−'}$${Math.abs(Math.round(v))}`
              }
              fill="#e4e4e7"
              fontSize={12}
              fontWeight={600}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
