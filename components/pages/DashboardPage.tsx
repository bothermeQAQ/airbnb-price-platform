'use client';

import { Reveal } from '@/components/Reveal';
import { BoroughMap } from '@/components/BoroughMap';
import { NeighborhoodHeatmap } from '@/components/NeighborhoodHeatmap';
import { MaeTimeline } from '@/components/charts/MaeTimeline';
import { RoomTypeChart } from '@/components/charts/RoomTypeChart';
import { PriceHistogram } from '@/components/charts/PriceHistogram';
import { TopNeighborhoods } from '@/components/charts/TopNeighborhoods';
import { TierChart } from '@/components/charts/TierChart';
import { XIcon } from '@/components/Icons';
import { FAILED_EXPERIMENTS, PROJECT, TIER_STATS } from '@/lib/data';

const GLANCE = [
  { label: 'Training rows', value: PROJECT.trainRows.toLocaleString() },
  { label: 'Test rows', value: PROJECT.testRows.toLocaleString() },
  { label: 'Raw columns', value: String(PROJECT.columns) },
  { label: 'Mean price', value: `$${PROJECT.meanPrice}` },
  { label: 'Median price', value: `$${PROJECT.medianPrice}` },
  { label: 'Snapshot', value: PROJECT.snapshot },
];

export function DashboardPage() {
  return (
    <div>
      {/* header */}
      <section className="border-b border-white/[0.06] pb-10 pt-32">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-grid mask-fade-b opacity-50" />
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className="section-eyebrow">Market dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            The NYC short-let market.
          </h1>
          <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-zinc-400">
            Pricing geography, distribution and model performance — every figure traces
            back to the {PROJECT.trainRows.toLocaleString()}-row training set.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] sm:grid-cols-3 lg:grid-cols-6">
            {GLANCE.map((g) => (
              <div key={g.label} className="bg-ink-950 px-4 py-4">
                <p className="num font-mono text-xl font-bold text-white">{g.value}</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-wider text-zinc-500">
                  {g.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* borough heatmap */}
      <Section
        eyebrow="Pricing geography"
        title="Average nightly price by borough"
        sub="A stylized heatmap of the five boroughs. Hover to inspect — Manhattan commands a 2.6× premium over the Bronx."
      >
        <BoroughMap />
      </Section>

      {/* neighborhood heatmap */}
      <Section
        eyebrow="Neighborhood detail"
        title="Median price across modeled neighborhoods"
        sub="Every neighborhood the engine prices, ranked by entire-home median nightly rate."
      >
        <NeighborhoodHeatmap />
      </Section>

      {/* distributions */}
      <Section
        eyebrow="Distribution"
        title="Where the listings sit"
        sub="Room type sets the price floor; the overall distribution is sharply right-skewed."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Average price by room type"
            note="Entire homes price ~2× private rooms"
          >
            <RoomTypeChart />
          </ChartCard>
          <ChartCard
            title="Price distribution"
            note={`Mean $${PROJECT.meanPrice} vs median $${PROJECT.medianPrice} — a long luxury tail`}
          >
            <PriceHistogram />
          </ChartCard>
        </div>
      </Section>

      {/* top neighborhoods */}
      <Section
        eyebrow="Premium markets"
        title="Top 10 most expensive neighborhoods"
        sub="Manhattan dominates the high end; DUMBO and Park Slope carry Brooklyn into the top tier."
      >
        <ChartCard title="Median nightly price · top 10" note="Colored by borough">
          <TopNeighborhoods />
        </ChartCard>
      </Section>

      {/* model performance */}
      <section className="border-t border-white/[0.06] py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <p className="section-eyebrow">Model performance</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              How well the ensemble actually predicts.
            </h2>
          </Reveal>

          {/* OOF trajectory */}
          <Reveal delay={0.06}>
            <ChartCard
              className="mt-8"
              title="Out-of-fold MAE trajectory"
              note="Seven development rounds · 36.83 → 35.57"
            >
              <MaeTimeline
                height={320}
                domain={[35, 38]}
                refs={[
                  { y: PROJECT.mae, label: 'Public LB 36.18', color: '#34d399' },
                  {
                    y: PROJECT.oofGroupKfold,
                    label: 'GroupKFold (honest) 37.49',
                    color: '#fbbf24',
                  },
                ]}
              />
              <p className="mt-3 border-t border-white/[0.06] pt-3 text-sm text-zinc-500">
                The honest GroupKFold retrain at{' '}
                <span className="font-mono text-amber-300">37.49</span> exposed ~1.9 MAE of
                host-ID leakage in the random-KFold OOF — the public LB sits between the two.
              </p>
            </ChartCard>
          </Reveal>

          {/* per-tier */}
          <Reveal delay={0.06}>
            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
              <ChartCard title="Per-tier segment MAE" note="Oracle tier knowledge">
                <TierChart />
              </ChartCard>
              <div className="flex flex-col gap-3">
                {TIER_STATS.map((t) => (
                  <div key={t.tier} className="card flex-1 p-5">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-sm font-semibold text-white">
                          {t.tier} tier
                        </span>
                        <span className="ml-2 font-mono text-xs text-zinc-500">
                          {t.range}
                        </span>
                      </div>
                      <span className="num font-mono text-2xl font-bold text-emerald-400">
                        {t.mae.toFixed(1)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{t.note}</p>
                    <p className="mt-2 font-mono text-[11px] text-zinc-600">
                      ~{t.rows.toLocaleString()} rows
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* what didn't work */}
          <Reveal delay={0.06}>
            <div className="mt-12">
              <h3 className="text-xl font-semibold text-white">What didn&apos;t work</h3>
              <p className="mt-1.5 text-sm text-zinc-500">
                Negative results are signal too — six approaches that were tried and dropped.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {FAILED_EXPERIMENTS.map((f) => (
                  <div key={f.title} className="card card-hover p-5">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                        <XIcon size={14} />
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{f.title}</h4>
                        <p className="mt-0.5 font-mono text-xs text-rose-300/80">
                          {f.result}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-500">{f.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- helpers */

function Section({
  eyebrow,
  title,
  sub,
  children,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-white/[0.06] py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <p className="section-eyebrow">{eyebrow}</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-500">
            {sub}
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="mt-8">{children}</div>
        </Reveal>
      </div>
    </section>
  );
}

function ChartCard({
  title,
  note,
  className = '',
  children,
}: {
  title: string;
  note?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`card p-5 sm:p-6 ${className}`}>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
          {title}
        </h3>
        {note && (
          <span className="hidden text-right font-mono text-[11px] text-zinc-600 sm:block">
            {note}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
