'use client';

import { motion } from 'framer-motion';
import { Reveal } from '@/components/Reveal';
import {
  ArrowRight,
  BeakerIcon,
  CpuIcon,
  DatabaseIcon,
  LayersIcon,
  RouteIcon,
  SparkIcon,
  TargetIcon,
  TrendDown,
} from '@/components/Icons';
import {
  APP_STACK,
  FEATURE_GROUPS,
  KEY_TECHNIQUES,
  MODEL_ARCHITECTURE,
  PIPELINE_STAGES,
  PROJECT,
  TECH_STACK,
} from '@/lib/data';

const STAGE_ICONS = [
  <DatabaseIcon key="0" size={18} />,
  <SparkIcon key="1" size={18} />,
  <LayersIcon key="2" size={18} />,
  <CpuIcon key="3" size={18} />,
  <RouteIcon key="4" size={18} />,
  <TargetIcon key="5" size={18} />,
];

export function MethodologyPage() {
  const featureTotal = FEATURE_GROUPS.reduce((s, g) => s + g.count, 0);
  const maxFeature = Math.max(...FEATURE_GROUPS.map((g) => g.count));
  const maxDelta = Math.max(...KEY_TECHNIQUES.map((t) => Math.abs(t.delta)));

  return (
    <div>
      {/* header */}
      <section className="border-b border-white/[0.06] pb-10 pt-32">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-grid mask-fade-b opacity-50" />
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className="section-eyebrow">Methodology</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            How the model is built.
          </h1>
          <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-zinc-400">
            From {PROJECT.columns} raw columns to a {PROJECT.baseModels}-model stacked
            ensemble — the full pipeline, the feature groups, and the techniques that moved
            the metric.
          </p>
        </div>
      </section>

      {/* ===================== PIPELINE ===================== */}
      <section className="border-t border-white/[0.06] py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <p className="section-eyebrow">The pipeline</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Six stages, end to end.
            </h2>
          </Reveal>

          <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-stretch">
            {PIPELINE_STAGES.map((s, i) => (
              <div key={s.title} className="flex flex-col lg:flex-1 lg:flex-row lg:items-stretch">
                <Reveal delay={i * 0.06} className="lg:flex-1">
                  <div className="card card-hover h-full p-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        {STAGE_ICONS[i]}
                      </span>
                      <span className="font-mono text-[11px] text-zinc-600">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-white">{s.title}</h3>
                    <p className="mt-0.5 font-mono text-[11px] text-emerald-400/90">
                      {s.sub}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-500">{s.detail}</p>
                  </div>
                </Reveal>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div className="flex items-center justify-center py-1 text-zinc-700 lg:px-1">
                    <ArrowRight size={16} className="hidden lg:block" />
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lg:hidden"
                    >
                      <path d="M12 5v14M6 13l6 6 6-6" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FEATURE GROUPS ===================== */}
      <section className="border-t border-white/[0.06] py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-eyebrow">Feature engineering</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {featureTotal} features across eight groups.
                </h2>
              </div>
              <span className="pill !text-sm">
                <SparkIcon size={14} className="text-emerald-400" />
                {PROJECT.featuresNumeric} numeric + 14 categorical
              </span>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {FEATURE_GROUPS.map((g, i) => (
              <Reveal key={g.group} delay={i * 0.04}>
                <div className="card card-hover p-5">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-semibold text-white">{g.group}</h3>
                    <span className="num font-mono text-lg font-bold text-emerald-400">
                      {g.count}
                    </span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(g.count / maxFeature) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, ease: [0.21, 0.47, 0.32, 0.98] }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                    />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                    {g.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== MODEL ARCHITECTURE ===================== */}
      <section className="border-t border-white/[0.06] py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <p className="section-eyebrow">Model architecture</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              The {PROJECT.baseModels}-model base layer.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
              Every base model produces a 5-fold out-of-fold prediction column. A
              HuberRegressor blends all {PROJECT.stackerFeatures} stacker features.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-8 overflow-hidden rounded-2xl border border-white/[0.07]">
              {/* table head */}
              <div className="hidden grid-cols-[1.1fr_1.7fr_0.5fr] gap-4 border-b border-white/[0.07] bg-white/[0.02] px-5 py-3 md:grid">
                <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                  Model family
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                  Variants & role
                </span>
                <span className="text-right font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                  Count
                </span>
              </div>
              {MODEL_ARCHITECTURE.map((m, i) => (
                <div
                  key={m.family}
                  className={`grid gap-2 px-5 py-4 transition-colors hover:bg-white/[0.02] md:grid-cols-[1.1fr_1.7fr_0.5fr] md:gap-4 md:items-center ${
                    i > 0 ? 'border-t border-white/[0.06]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between md:block">
                    <span className="text-sm font-semibold text-white">{m.family}</span>
                    <span className="num font-mono text-lg font-bold text-emerald-400 md:hidden">
                      {m.count}
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-xs text-emerald-400/80">{m.variants}</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-500">{m.role}</p>
                  </div>
                  <span className="num hidden text-right font-mono text-lg font-bold text-emerald-400 md:block">
                    {m.count}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===================== KEY TECHNIQUES ===================== */}
      <section className="border-t border-white/[0.06] py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <p className="section-eyebrow">What moved the metric</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Techniques ranked by MAE impact.
            </h2>
          </Reveal>

          <div className="mt-8 grid gap-3 lg:grid-cols-2">
            {KEY_TECHNIQUES.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.05}>
                <div className="card card-hover p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-base font-semibold text-white">{t.name}</h3>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 font-mono text-sm font-bold text-emerald-400">
                      <TrendDown size={13} />
                      {t.delta.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 font-mono text-xs text-zinc-500">
                    <span className="text-zinc-400">{t.from.toFixed(2)}</span>
                    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(Math.abs(t.delta) / maxDelta) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9 }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                      />
                    </div>
                    <span className="text-emerald-400">{t.to.toFixed(2)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-500">{t.why}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== VALIDATION CALLOUT ===================== */}
      <section className="border-t border-white/[0.06] py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <div className="card relative overflow-hidden p-6 sm:p-8">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
              <div className="flex items-center gap-2.5 text-amber-300">
                <BeakerIcon size={18} />
                <span className="font-mono text-xs uppercase tracking-[0.18em]">
                  Critical diagnostic
                </span>
              </div>
              <h3 className="mt-3 max-w-2xl text-xl font-semibold text-white sm:text-2xl">
                Host-ID leakage made the random-KFold OOF optimistic by ~1.9 MAE.
              </h3>
              <p className="mt-3 max-w-3xl text-pretty leading-relaxed text-zinc-400">
                27% of listings share a host with another listing. A full GroupKFold
                retrain scored {PROJECT.oofGroupKfold} — the honest, leakage-free estimate —
                versus 35.57 for random KFold. The {PROJECT.maeFull} public leaderboard
                result sits between the two: host-specific patterns are real and exploitable
                when test hosts also appear in training.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { v: '35.57', l: 'Random-KFold OOF', c: 'text-emerald-400' },
                  { v: PROJECT.maeFull.toString(), l: 'Kaggle public LB', c: 'text-white' },
                  { v: PROJECT.oofGroupKfold.toString(), l: 'GroupKFold (honest)', c: 'text-amber-300' },
                ].map((x) => (
                  <div
                    key={x.l}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <p className={`num font-mono text-2xl font-bold ${x.c}`}>{x.v}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{x.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===================== TECH STACK ===================== */}
      <section className="border-t border-white/[0.06] py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <p className="section-eyebrow">Tech stack</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Built with.
            </h2>
          </Reveal>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <Reveal>
              <div className="card h-full p-6">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CpuIcon size={16} />
                  <h3 className="font-mono text-xs uppercase tracking-[0.16em]">
                    Modeling pipeline
                  </h3>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {TECH_STACK.map((t) => (
                    <span key={t} className="pill !text-[13px] !text-zinc-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="card h-full p-6">
                <div className="flex items-center gap-2 text-emerald-400">
                  <SparkIcon size={16} />
                  <h3 className="font-mono text-xs uppercase tracking-[0.16em]">
                    This web platform
                  </h3>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {APP_STACK.map((t) => (
                    <span key={t} className="pill !text-[13px] !text-zinc-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
