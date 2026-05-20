'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BOROUGH_STATS, BOROUGHS, type Borough } from '@/lib/data';
import { heatColor } from '@/lib/color';

// Stylized NYC borough geometry (abstract, not geographically exact).
const SHAPES: Record<Borough, { d: string; cx: number; cy: number }> = {
  Bronx: {
    d: 'M235,30 L340,18 L380,80 L320,118 L250,100 L218,58 Z',
    cx: 288,
    cy: 62,
  },
  Manhattan: {
    d: 'M210,68 L242,98 L218,255 L178,242 L190,108 Z',
    cx: 208,
    cy: 168,
  },
  Queens: {
    d: 'M322,112 L462,128 L456,308 L322,322 L296,210 L308,150 Z',
    cx: 378,
    cy: 218,
  },
  Brooklyn: {
    d: 'M214,262 L300,272 L322,328 L286,408 L176,392 L160,308 Z',
    cx: 238,
    cy: 332,
  },
  'Staten Island': {
    d: 'M40,300 L138,294 L152,366 L96,414 L28,372 Z',
    cx: 86,
    cy: 350,
  },
};

const MIN = 70;
const MAX = 210;

export function BoroughMap() {
  const [active, setActive] = useState<Borough>('Manhattan');
  const stat = BOROUGH_STATS[active];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {/* Map */}
      <div className="relative rounded-2xl border border-white/[0.07] bg-ink-900/60 p-4">
        <svg viewBox="0 0 480 440" className="h-auto w-full">
          <defs>
            <filter id="boroughGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {BOROUGHS.map((b) => {
            const s = SHAPES[b];
            const isActive = active === b;
            const fill = heatColor(BOROUGH_STATS[b].avgPrice, MIN, MAX);
            return (
              <g
                key={b}
                onMouseEnter={() => setActive(b)}
                className="cursor-pointer"
                filter={isActive ? 'url(#boroughGlow)' : undefined}
              >
                <motion.path
                  d={s.d}
                  fill={fill}
                  stroke={isActive ? '#6ee7b7' : 'rgba(255,255,255,0.14)'}
                  strokeWidth={isActive ? 2.4 : 1.2}
                  strokeLinejoin="round"
                  animate={{ opacity: isActive ? 1 : 0.62 }}
                  transition={{ duration: 0.25 }}
                />
                <text
                  x={s.cx}
                  y={s.cy - 4}
                  textAnchor="middle"
                  className="pointer-events-none fill-white font-sans"
                  fontSize={13}
                  fontWeight={600}
                >
                  {b}
                </text>
                <text
                  x={s.cx}
                  y={s.cy + 14}
                  textAnchor="middle"
                  className="pointer-events-none font-mono"
                  fill="rgba(255,255,255,0.72)"
                  fontSize={12}
                >
                  ${BOROUGH_STATS[b].avgPrice}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="mt-2 flex items-center gap-3 px-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            ${MIN}
          </span>
          <div
            className="h-2 flex-1 rounded-full"
            style={{
              background: `linear-gradient(to right, ${heatColor(MIN, MIN, MAX)}, ${heatColor(
                (MIN + MAX) / 2,
                MIN,
                MAX,
              )}, ${heatColor(MAX, MIN, MAX)})`,
            }}
          />
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            ${MAX}+
          </span>
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex flex-col gap-3">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="card flex-1 p-6"
        >
          <p className="section-eyebrow">Borough focus</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{stat.borough}</h3>
          <div className="mt-5 space-y-4">
            <Metric label="Average nightly price" value={`$${stat.avgPrice}`} accent />
            <Metric label="Active listings" value={stat.listings.toLocaleString()} />
            <Metric label="Priciest neighborhood" value={stat.topNeighborhood} />
          </div>
        </motion.div>
        <div className="grid grid-cols-1 gap-2">
          {BOROUGHS.map((b) => (
            <button
              key={b}
              onMouseEnter={() => setActive(b)}
              onClick={() => setActive(b)}
              className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5
                text-sm transition-colors ${
                  active === b
                    ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
                    : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15'
                }`}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ background: heatColor(BOROUGH_STATS[b].avgPrice, MIN, MAX) }}
                />
                <span className={active === b ? 'text-white' : 'text-zinc-400'}>{b}</span>
              </span>
              <span className="num font-mono text-zinc-300">
                ${BOROUGH_STATS[b].avgPrice}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.05] pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span
        className={`num font-mono text-lg font-semibold ${
          accent ? 'text-emerald-400' : 'text-white'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
