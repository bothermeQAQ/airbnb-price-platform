'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DriversChart } from '@/components/charts/DriversChart';
import {
  ArrowRight,
  BoltIcon,
  CheckIcon,
  CpuIcon,
  GaugeIcon,
  MapPinIcon,
  TrendDown,
} from '@/components/Icons';
import {
  AMENITIES,
  BOROUGHS,
  NEIGHBORHOODS,
  PROPERTY_TYPES,
  ROOM_TYPES,
  type AmenityId,
} from '@/lib/data';
import { predictPrice, type PredictInput, type Prediction } from '@/lib/predict';

const DEFAULT_INPUT: PredictInput = {
  neighborhood: 'Williamsburg',
  roomType: 'entire',
  propertyType: 'apartment',
  bedrooms: 1,
  bathrooms: 1,
  accommodates: 2,
  amenities: ['wifi', 'kitchen', 'ac', 'washer'],
  numReviews: 24,
  reviewScore: 95,
  description: 'Bright, recently renovated apartment with great natural light near the subway.',
};

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function PredictPage() {
  const [input, setInput] = useState<PredictInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<Prediction>(() => predictPrice(DEFAULT_INPUT));
  const [analyzing, setAnalyzing] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [runId, setRunId] = useState(0);

  // Initial "inference" animation on mount.
  useEffect(() => {
    const t = setTimeout(() => setAnalyzing(false), 850);
    return () => clearTimeout(t);
  }, []);

  const live = useMemo(() => predictPrice(input), [input]);

  function set<K extends keyof PredictInput>(key: K, value: PredictInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function toggleAmenity(id: AmenityId) {
    setInput((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter((a) => a !== id)
        : [...prev.amenities, id],
    }));
    setDirty(true);
  }

  function run() {
    setAnalyzing(true);
    setTimeout(() => {
      setResult(predictPrice(input));
      setRunId((n) => n + 1);
      setDirty(false);
      setAnalyzing(false);
    }, 850);
  }

  return (
    <div className="relative">
      {/* header */}
      <section className="border-b border-white/[0.06] pb-10 pt-32">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-grid mask-fade-b opacity-50" />
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className="section-eyebrow">Price prediction tool</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Estimate a listing.
          </h1>
          <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-zinc-400">
            Configure a NYC listing and get an instant nightly estimate, a confidence band
            and a transparent breakdown of every price driver.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 sm:px-8 lg:grid-cols-[1.04fr_0.96fr]">
          {/* ===================== FORM ===================== */}
          <div className="space-y-5">
            <FormCard title="Location & type" step="01">
              <Field label="Neighborhood">
                <Select
                  value={input.neighborhood}
                  onChange={(v) => set('neighborhood', v)}
                >
                  {BOROUGHS.map((b) => (
                    <optgroup key={b} label={b}>
                      {NEIGHBORHOODS.filter((n) => n.borough === b).map((n) => (
                        <option key={n.name} value={n.name}>
                          {n.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </Field>

              <Field label="Room type">
                <Segmented
                  options={ROOM_TYPES.map((r) => ({ id: r.id, label: r.label }))}
                  value={input.roomType}
                  onChange={(v) => set('roomType', v as PredictInput['roomType'])}
                />
              </Field>

              <Field label="Property type">
                <Select
                  value={input.propertyType}
                  onChange={(v) => set('propertyType', v as PredictInput['propertyType'])}
                >
                  {PROPERTY_TYPES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </FormCard>

            <FormCard title="Capacity" step="02">
              <div className="grid grid-cols-3 gap-3">
                <Stepper
                  label="Bedrooms"
                  value={input.bedrooms}
                  min={0}
                  max={10}
                  step={1}
                  onChange={(v) => set('bedrooms', v)}
                />
                <Stepper
                  label="Bathrooms"
                  value={input.bathrooms}
                  min={0}
                  max={8}
                  step={0.5}
                  onChange={(v) => set('bathrooms', v)}
                />
                <Stepper
                  label="Guests"
                  value={input.accommodates}
                  min={1}
                  max={16}
                  step={1}
                  onChange={(v) => set('accommodates', v)}
                />
              </div>
            </FormCard>

            <FormCard title="Amenities" step="03">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {AMENITIES.map((a) => {
                  const on = input.amenities.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAmenity(a.id)}
                      className={`group flex items-center gap-2 rounded-xl border px-3 py-2.5
                        text-left text-sm transition-all ${
                          on
                            ? 'border-emerald-500/40 bg-emerald-500/[0.08] text-white'
                            : 'border-white/[0.07] bg-white/[0.02] text-zinc-400 hover:border-white/15'
                        }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded
                          border transition-colors ${
                            on
                              ? 'border-emerald-400 bg-emerald-400 text-emerald-950'
                              : 'border-white/20'
                          }`}
                      >
                        {on && <CheckIcon size={11} strokeWidth={3} />}
                      </span>
                      <span className="truncate">{a.label}</span>
                    </button>
                  );
                })}
              </div>
            </FormCard>

            <FormCard title="Reviews" step="04">
              <div className="grid gap-4 sm:grid-cols-2">
                <Stepper
                  label="Number of reviews"
                  value={input.numReviews}
                  min={0}
                  max={800}
                  step={1}
                  bigStep={10}
                  onChange={(v) => set('numReviews', v)}
                />
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-300">Review score</span>
                    <span className="num font-mono text-sm font-semibold text-emerald-400">
                      {input.reviewScore}
                      <span className="text-zinc-600"> / 100</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={100}
                    value={input.reviewScore}
                    onChange={(e) => set('reviewScore', Number(e.target.value))}
                    className="slider w-full"
                    style={
                      {
                        '--p': `${((input.reviewScore - 60) / 40) * 100}%`,
                      } as React.CSSProperties
                    }
                  />
                  <div className="mt-1 flex justify-between font-mono text-[10px] text-zinc-600">
                    <span>60</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
            </FormCard>

            <FormCard title="Listing description" step="05">
              <textarea
                value={input.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                placeholder="Describe the listing — words like 'renovated', 'view' or 'spacious' carry price signal."
                className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.02]
                  px-3.5 py-3 text-sm text-zinc-200 outline-none transition-colors
                  placeholder:text-zinc-600 focus:border-emerald-500/40"
              />
            </FormCard>

            <button
              onClick={run}
              className={`btn-primary w-full !py-3.5 ${
                dirty ? 'animate-pulse' : ''
              }`}
            >
              <CpuIcon size={16} />
              {dirty ? 'Update estimate' : 'Run Prediction'}
            </button>
          </div>

          {/* ===================== RESULT ===================== */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ResultPanel
              result={result}
              live={live}
              dirty={dirty}
              analyzing={analyzing}
              runId={runId}
            />
          </div>
        </div>
      </section>

      <style jsx global>{`
        .slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 999px;
          background: linear-gradient(
            to right,
            #10b981 0%,
            #10b981 var(--p, 50%),
            rgba(255, 255, 255, 0.09) var(--p, 50%),
            rgba(255, 255, 255, 0.09) 100%
          );
          outline: none;
        }
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: #ecfdf5;
          border: 3px solid #10b981;
          cursor: pointer;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.18);
        }
        .slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: #ecfdf5;
          border: 3px solid #10b981;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

/* ---------------------------------------------------------------- form bits */

function FormCard({
  title,
  step,
  children,
}: {
  title: string;
  step: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="font-mono text-[11px] font-semibold text-emerald-400">{step}</span>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
          {title}
        </h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-white/[0.07] bg-white/[0.02]
          px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition-colors
          focus:border-emerald-500/40"
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-1">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className="relative rounded-lg px-2 py-2 text-center text-[13px] font-medium transition-colors"
          >
            {active && (
              <motion.span
                layoutId="seg-active"
                className="absolute inset-0 rounded-lg bg-emerald-500"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className={`relative ${active ? 'text-emerald-950' : 'text-zinc-400'}`}>
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  step,
  bigStep,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  bigStep?: number;
  onChange: (v: number) => void;
}) {
  const inc = bigStep ?? step;
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const fmt = (v: number) => (Number.isInteger(v) ? `${v}` : v.toFixed(1));
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-zinc-300">{label}</span>
      <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-1.5 py-1.5">
        <StepBtn onClick={() => onChange(clamp(value - inc))} disabled={value <= min}>
          −
        </StepBtn>
        <span className="num font-mono text-base font-semibold text-white">{fmt(value)}</span>
        <StepBtn onClick={() => onChange(clamp(value + inc))} disabled={value >= max}>
          +
        </StepBtn>
      </div>
    </div>
  );
}

function StepBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]
        text-lg text-zinc-300 transition-colors hover:bg-emerald-500/15 hover:text-emerald-300
        disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white/[0.04]
        disabled:hover:text-zinc-300"
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------- result panel */

function ResultPanel({
  result,
  live,
  dirty,
  analyzing,
  runId,
}: {
  result: Prediction;
  live: Prediction;
  dirty: boolean;
  analyzing: boolean;
  runId: number;
}) {
  const tierColor = {
    Low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    Mid: 'text-sky-300 bg-sky-500/10 border-sky-500/25',
    High: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
  }[result.tier];

  const above = result.positionPct >= 0;

  return (
    <div className="card relative overflow-hidden">
      {/* top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0" />

      <div className="p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <span className="section-eyebrow">Estimated price</span>
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tierColor}`}>
            {result.tier} tier
          </span>
        </div>

        <AnimatePresence mode="wait">
          {analyzing ? (
            <Analyzing key="analyzing" />
          ) : (
            <motion.div
              key={`r-${runId}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              {/* price */}
              <div className="mt-4 flex items-end gap-2">
                <span className="num font-mono text-6xl font-bold tracking-tight text-white">
                  $<TweenNumber value={result.price} />
                </span>
                <span className="pb-2 text-lg text-zinc-500">/ night</span>
              </div>

              {/* range bar */}
              <RangeBar low={result.low} high={result.high} price={result.price} />

              {/* market position */}
              <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    above
                      ? 'bg-emerald-500/12 text-emerald-400'
                      : 'bg-sky-500/12 text-sky-300'
                  }`}
                >
                  <MapPinIcon size={15} />
                </span>
                <p className="text-sm text-zinc-400">
                  <span
                    className={`font-mono font-semibold ${
                      above ? 'text-emerald-400' : 'text-sky-300'
                    }`}
                  >
                    {Math.abs(result.positionPct)}% {above ? 'above' : 'below'}
                  </span>{' '}
                  the {result.neighborhood} median of{' '}
                  <span className="font-mono text-zinc-300">${result.median}</span>
                </p>
              </div>

              {/* drivers */}
              <div className="mt-6 border-t border-white/[0.06] pt-5">
                <div className="flex items-center gap-2">
                  <TrendDown size={15} className="text-emerald-400" />
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
                    Top price drivers
                  </h4>
                </div>
                <div className="mt-2">
                  <DriversChart drivers={result.drivers} />
                </div>
              </div>

              {/* confidence */}
              <ConfidenceMeter
                value={result.confidence}
                label={result.confidenceLabel}
                tier={result.tier}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* dirty hint */}
      <AnimatePresence>
        {dirty && !analyzing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-amber-500/15 bg-amber-500/[0.05]"
          >
            <p className="flex items-center gap-2 px-6 py-3 text-xs text-amber-300/90">
              <BoltIcon size={13} />
              Inputs changed — current estimate would be ${live.price}. Run again to update.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="border-t border-white/[0.06] px-6 py-3.5 text-[11px] leading-relaxed text-zinc-600">
        Live estimates use a transparent heuristic engine calibrated to the ensemble&apos;s
        learned feature effects. The full 40-model pipeline runs offline.
      </p>
    </div>
  );
}

function Analyzing() {
  return (
    <motion.div
      key="analyzing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="py-10"
    >
      <div className="flex items-center gap-3">
        <span className="relative flex h-9 w-9 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <CpuIcon size={18} />
          </span>
        </span>
        <div>
          <p className="text-sm font-semibold text-white">Analyzing 40 models…</p>
          <p className="font-mono text-xs text-zinc-500">Stacking · residual correction</p>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {[68, 100, 84].map((w, i) => (
          <div key={i} className="relative h-3 overflow-hidden rounded-full bg-white/[0.04]" style={{ width: `${w}%` }}>
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function RangeBar({ low, high, price }: { low: number; high: number; price: number }) {
  return (
    <div className="mt-4">
      <div className="relative h-2 rounded-full bg-white/[0.05]">
        <div className="absolute inset-y-0 left-[14%] right-[14%] rounded-full bg-gradient-to-r from-emerald-600/50 via-emerald-500 to-emerald-600/50" />
        <motion.div
          initial={{ left: '50%' }}
          animate={{ left: '50%' }}
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-emerald-400 bg-emerald-950 shadow-[0_0_12px_rgba(16,185,129,0.7)]"
        />
      </div>
      <div className="mt-2 flex justify-between font-mono text-xs">
        <span className="text-zinc-500">${low}</span>
        <span className="text-emerald-400">likely range</span>
        <span className="text-zinc-500">${high}</span>
      </div>
    </div>
  );
}

function ConfidenceMeter({
  value,
  label,
  tier,
}: {
  value: number;
  label: string;
  tier: string;
}) {
  return (
    <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <GaugeIcon size={15} className="text-emerald-400" />
          Confidence
        </span>
        <span className="num font-mono text-sm font-semibold text-white">{value}%</span>
      </div>
      <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
        />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-zinc-500">
        <span className="font-medium text-zinc-300">{label}.</span>{' '}
        {tier === 'High'
          ? 'High-price listings are heavy-tailed — the model reports a wider band here (segment MAE ≈ 127).'
          : tier === 'Mid'
            ? 'Mid-tier listings drive the headline metric (segment MAE ≈ 30).'
            : 'The low-price segment is dense and the easiest to fit (segment MAE ≈ 11).'}
      </p>
    </div>
  );
}

/* Tweens smoothly from the previous value to the new one whenever value changes. */
function TweenNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    if (from === to) return;
    let raf = 0;
    const start = performance.now();
    const dur = 800;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setDisplay(from + (to - from) * easeOutExpo(p));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{Math.round(display)}</>;
}
