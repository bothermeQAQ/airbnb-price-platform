'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PRICE_HISTOGRAM } from '@/lib/data';
import { TooltipShell, TooltipRow } from './TooltipShell';

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <TooltipShell title={`${p.band} / night`}>
      <TooltipRow label="Listings" value={p.count.toLocaleString()} />
    </TooltipShell>
  );
}

export function PriceHistogram({ height = 260 }: { height?: number }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={PRICE_HISTOGRAM} margin={{ top: 12, right: 12, bottom: 4, left: -8 }}>
          <defs>
            <linearGradient id="histFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.055)" vertical={false} />
          <XAxis
            dataKey="band"
            tick={{ fill: '#71717a', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            interval={0}
            angle={-32}
            textAnchor="end"
            height={52}
          />
          <YAxis
            tick={{ fill: '#71717a', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.14)' }} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#34d399"
            strokeWidth={2.5}
            fill="url(#histFill)"
            dot={{ r: 3, fill: '#0a0a0a', stroke: '#34d399', strokeWidth: 2 }}
            activeDot={{ r: 5, fill: '#34d399', stroke: '#0a0a0a', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
