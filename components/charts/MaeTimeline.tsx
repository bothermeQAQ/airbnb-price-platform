'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MAE_TRAJECTORY } from '@/lib/data';
import { TooltipShell, TooltipRow } from './TooltipShell';

interface Ref {
  y: number;
  label: string;
  color: string;
}

interface MaeTimelineProps {
  height?: number;
  domain?: [number, number];
  refs?: Ref[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <TooltipShell title={p.stage}>
      <p className="max-w-[220px] text-xs leading-snug text-zinc-400">{p.detail}</p>
      <div className="mt-1.5">
        <TooltipRow label="OOF MAE" value={p.mae.toFixed(2)} />
      </div>
    </TooltipShell>
  );
}

export function MaeTimeline({
  height = 320,
  domain = [35, 37.3],
  refs = [],
}: MaeTimelineProps) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={MAE_TRAJECTORY} margin={{ top: 16, right: 14, bottom: 4, left: -14 }}>
          <defs>
            <linearGradient id="maeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.055)" vertical={false} />
          <XAxis
            dataKey="stage"
            tick={{ fill: '#71717a', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            dy={6}
          />
          <YAxis
            domain={domain}
            tick={{ fill: '#71717a', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v) => v.toFixed(1)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.14)' }} />
          {refs.map((r) => (
            <ReferenceLine
              key={r.label}
              y={r.y}
              stroke={r.color}
              strokeDasharray="5 5"
              strokeOpacity={0.7}
              label={{
                value: r.label,
                fill: r.color,
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />
          ))}
          <Area
            type="monotone"
            dataKey="mae"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#maeFill)"
            dot={{ r: 3.5, fill: '#0a0a0a', stroke: '#10b981', strokeWidth: 2 }}
            activeDot={{ r: 5.5, fill: '#10b981', stroke: '#0a0a0a', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
