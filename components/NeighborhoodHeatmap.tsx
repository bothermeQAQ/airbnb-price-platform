import { HEATMAP_NEIGHBORHOODS } from '@/lib/data';
import { heatColor } from '@/lib/color';

const MIN = 45;
const MAX = 235;

// Grid heatmap of the most-listed neighborhoods, by real median nightly price.
export function NeighborhoodHeatmap() {
  const sorted = [...HEATMAP_NEIGHBORHOODS].sort((a, b) => b.median - a.median);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {sorted.map((n) => {
        const darkText = n.median > 158;
        return (
          <div
            key={n.name}
            className="group relative overflow-hidden rounded-xl border border-white/[0.06]
              p-3.5 transition-transform duration-200 hover:z-10 hover:scale-[1.04]
              hover:ring-1 hover:ring-emerald-300/50"
            style={{ background: heatColor(n.median, MIN, MAX) }}
          >
            <p
              className={`truncate text-[13px] font-medium ${
                darkText ? 'text-emerald-950' : 'text-white'
              }`}
            >
              {n.name}
            </p>
            <p
              className={`mt-1 font-mono text-lg font-bold ${
                darkText ? 'text-emerald-950' : 'text-white'
              }`}
            >
              ${n.median}
            </p>
            <p
              className={`text-[10px] uppercase tracking-wider ${
                darkText ? 'text-emerald-900/70' : 'text-white/55'
              }`}
            >
              {n.borough}
            </p>
          </div>
        );
      })}
    </div>
  );
}
