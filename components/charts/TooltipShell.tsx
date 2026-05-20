import type { ReactNode } from 'react';

// Shared dark container for all Recharts custom tooltips.
export function TooltipShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink-850/95 px-3.5 py-2.5 shadow-2xl backdrop-blur-md">
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {title}
      </p>
      <div className="mt-1 space-y-0.5">{children}</div>
    </div>
  );
}

export function TooltipRow({
  label,
  value,
  color = '#10b981',
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6 text-sm">
      <span className="flex items-center gap-1.5 text-zinc-400">
        <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
        {label}
      </span>
      <span className="num font-mono font-semibold text-white">{value}</span>
    </div>
  );
}
