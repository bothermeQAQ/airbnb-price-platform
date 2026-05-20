// "Built with a 40-model ML ensemble" — the recurring trust badge.
export function EnsembleBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 rounded-full border border-emerald-500/20
        bg-emerald-500/[0.07] px-3.5 py-1.5 ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      <span className="text-xs font-medium text-emerald-300">
        Built with a 40-model ML ensemble
      </span>
    </span>
  );
}
