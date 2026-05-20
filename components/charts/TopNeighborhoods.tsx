'use client';

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TOP_NEIGHBORHOODS } from '@/lib/data';
import { TooltipShell, TooltipRow } from './TooltipShell';

const BOROUGH_COLOR: Record<string, string> = {
  Manhattan: '#10b981',
  Brooklyn: '#34d399',
  Queens: '#5eead4',
  Bronx: '#fbbf24',
  'Staten Island': '#a78bfa',
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <TooltipShell title={p.name}>
      <TooltipRow label="Median / night" value={`$${p.price}`} />
      <TooltipRow label="Borough" value={p.borough} color="#52525b" />
    </TooltipShell>
  );
}

export function TopNeighborhoods({ height = 360 }: { height?: number }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={TOP_NEIGHBORHOODS}
          layout="vertical"
          margin={{ top: 4, right: 44, bottom: 4, left: 8 }}
        >
          <XAxis type="number" hide domain={[0, 'dataMax + 40']} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#d4d4d8', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={118}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="price" radius={[0, 6, 6, 0]} barSize={20}>
            {TOP_NEIGHBORHOODS.map((n, i) => (
              <Cell key={i} fill={BOROUGH_COLOR[n.borough] ?? '#10b981'} />
            ))}
            <LabelList
              dataKey="price"
              position="right"
              formatter={(v: number) => `$${v}`}
              fill="#ffffff"
              fontSize={12}
              fontWeight={600}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
