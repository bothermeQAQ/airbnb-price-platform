'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { AnimatedNumber } from './AnimatedNumber';

interface StatCardProps {
  icon: ReactNode;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  caption: string;
  delay?: number;
}

export function StatCard({
  icon,
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  label,
  caption,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={{ y: -5 }}
      className="card card-hover group relative overflow-hidden p-5 sm:p-6"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full
          bg-emerald-500/10 blur-2xl transition-opacity duration-300
          group-hover:bg-emerald-500/20"
      />
      <div className="flex items-center gap-2.5 text-emerald-400">
        {icon}
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">
          {label}
        </span>
      </div>
      <p className="num mt-4 font-mono text-4xl font-bold tracking-tight text-white sm:text-[2.7rem]">
        <AnimatedNumber
          value={value}
          decimals={decimals}
          prefix={prefix}
          suffix={suffix}
        />
      </p>
      <p className="mt-1.5 text-sm text-zinc-500">{caption}</p>
    </motion.div>
  );
}
