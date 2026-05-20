'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TIER_STATS } from '@/lib/data';
import { TooltipShell, TooltipRow } from './TooltipShell';

const COLORS = ['#10b981', '#facc15', '#f87171'];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <TooltipShell title={`${p.tier} tier · ${p.range}`}>
      <TooltipRow label="Segment MAE" value={p.mae.toFixed(1)} />
      <TooltipRow label="Rows" value={`~${p.rows.toLocaleString()}`} color="#52525b" />
    </TooltipShell>
  );
}

export function TierChart({ height = 280 }: { height?: number }) {
  const data = TIER_STATS.map((t) => ({ ...t, label: `${t.tier} (${t.range})` }));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 26, right: 12, bottom: 4, left: -14 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.055)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            dy={6}
          />
          <YAxis
            tick={{ fill: '#71717a', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="mae" radius={[6, 6, 0, 0]} barSize={66}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
            <LabelList
              dataKey="mae"
              position="top"
              formatter={(v: number) => v.toFixed(1)}
              fill="#ffffff"
              fontSize={13}
              fontWeight={600}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
