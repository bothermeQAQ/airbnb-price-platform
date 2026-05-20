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
import { ROOM_TYPE_STATS } from '@/lib/data';
import { TooltipShell, TooltipRow } from './TooltipShell';

const COLORS = ['#10b981', '#34d399', '#6ee7b7'];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <TooltipShell title={p.type}>
      <TooltipRow label="Avg price" value={`$${p.avgPrice}`} />
      <TooltipRow label="Listings" value={p.listings.toLocaleString()} color="#52525b" />
      <TooltipRow label="Share" value={`${p.share}%`} color="#52525b" />
    </TooltipShell>
  );
}

export function RoomTypeChart({ height = 280 }: { height?: number }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={ROOM_TYPE_STATS} margin={{ top: 24, right: 12, bottom: 4, left: -16 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.055)" vertical={false} />
          <XAxis
            dataKey="type"
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            dy={6}
          />
          <YAxis
            tick={{ fill: '#71717a', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={46}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="avgPrice" radius={[6, 6, 0, 0]} barSize={64}>
            {ROOM_TYPE_STATS.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
            <LabelList
              dataKey="avgPrice"
              position="top"
              formatter={(v: number) => `$${v}`}
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
