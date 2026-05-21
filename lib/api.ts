// ---------------------------------------------------------------------------
// Client for the FastAPI price-prediction backend.
//
// The /predict page calls the real model through fetchPrediction(). If the API
// is unreachable (e.g. the static site is deployed but the backend is offline)
// it falls back to the local heuristic in lib/predict.ts so the page still
// works — the caller is told which engine produced the result.
// ---------------------------------------------------------------------------

import { NEIGHBORHOODS } from './data';
import { predictPrice, type PredictInput, type Prediction } from './predict';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(
  /\/$/,
  '',
);

export type PredictionSource = 'api' | 'heuristic';

export interface PredictionResult {
  prediction: Prediction;
  source: PredictionSource;
}

export const apiBaseUrl = API_BASE;

/** POST a listing to the real model; fall back to the heuristic on failure. */
export async function fetchPrediction(input: PredictInput): Promise<PredictionResult> {
  try {
    const controller = new AbortController();
    // Generous timeout: a free-tier backend may be doing a cold start.
    const timer = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    const data = await res.json();
    return { prediction: mapApiResponse(data, input), source: 'api' };
  } catch {
    return { prediction: predictPrice(input), source: 'heuristic' };
  }
}

/** Map the FastAPI /predict payload onto the UI's Prediction shape. */
function mapApiResponse(data: any, input: PredictInput): Prediction {
  const nb = NEIGHBORHOODS.find((n) => n.name === input.neighborhood);
  const meta = data.meta ?? {};
  const price = Math.round(Number(data.predicted_price));
  const median: number = meta.neighbourhood_median ?? nb?.median ?? price;

  const confWord = String(data.confidence ?? 'medium');
  const score: number =
    meta.confidence_score ??
    (confWord === 'high' ? 86 : confWord === 'medium' ? 70 : 50);

  return {
    price,
    low: Math.round(Number(data.price_range?.low ?? price * 0.92)),
    high: Math.round(Number(data.price_range?.high ?? price * 1.08)),
    neighborhood: meta.neighbourhood ?? input.neighborhood,
    borough: (meta.borough ?? nb?.borough ?? 'Manhattan') as Prediction['borough'],
    median,
    positionPct: median ? Math.round(((price - median) / median) * 100) : 0,
    drivers: (data.price_drivers ?? []).map((d: any) => ({
      label: String(d.feature),
      value: Number(d.impact),
    })),
    confidence: score,
    confidenceLabel:
      confWord.charAt(0).toUpperCase() + confWord.slice(1) + ' confidence',
    tier: (meta.tier ??
      (price >= 300 ? 'High' : price >= 100 ? 'Mid' : 'Low')) as Prediction['tier'],
  };
}

/** Lightweight liveness check for the backend. */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}
