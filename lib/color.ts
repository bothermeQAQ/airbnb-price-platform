// Heatmap color ramp: dark emerald → bright emerald.

const STOPS: [number, [number, number, number]][] = [
  [0, [10, 48, 35]], // #0a3023
  [0.5, [16, 122, 84]], // #107a54
  [1, [52, 211, 153]], // #34d399
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// Returns an rgb() string for `value` interpolated within [min, max].
export function heatColor(value: number, min: number, max: number): string {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  let lo = STOPS[0];
  let hi = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (t >= STOPS[i][0] && t <= STOPS[i + 1][0]) {
      lo = STOPS[i];
      hi = STOPS[i + 1];
      break;
    }
  }
  const span = hi[0] - lo[0] || 1;
  const lt = (t - lo[0]) / span;
  const r = Math.round(lerp(lo[1][0], hi[1][0], lt));
  const g = Math.round(lerp(lo[1][1], hi[1][1], lt));
  const b = Math.round(lerp(lo[1][2], hi[1][2], lt));
  return `rgb(${r}, ${g}, ${b})`;
}
