'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { EnsembleBadge } from '@/components/EnsembleBadge';
import { StatCard } from '@/components/StatCard';
import { Reveal } from '@/components/Reveal';
import { MaeTimeline } from '@/components/charts/MaeTimeline';
import {
  ArrowRight,
  ArrowUpRight,
  BoltIcon,
  ChartIcon,
  CpuIcon,
  DatabaseIcon,
  LayersIcon,
  MapPinIcon,
  RouteIcon,
  SparkIcon,
  TargetIcon,
  TrendDown,
  TrophyIcon,
} from '@/components/Icons';
import { PROJECT } from '@/lib/data';

const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const heroItem = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] as const },
  },
};

export function LandingPage() {
  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden pb-20 pt-36 sm:pt-44">
        {/* backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-grid mask-radial opacity-70" />
          <div className="absolute left-1/2 top-[-6rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-emerald-500/12 blur-[120px]" />
          <div className="absolute left-[12%] top-40 h-72 w-72 animate-float rounded-full bg-emerald-600/10 blur-[100px]" />
          <div
            className="absolute right-[10%] top-24 h-80 w-80 animate-float rounded-full bg-teal-500/10 blur-[110px]"
            style={{ animationDelay: '-7s' }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <motion.div
            initial="hidden"
            animate="show"
            variants={heroContainer}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div variants={heroItem}>
              <EnsembleBadge />
            </motion.div>

            <motion.h1
              variants={heroItem}
              className="mt-6 text-balance text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl md:text-7xl"
            >
              <span className="text-gradient">Airbnb Price</span>
              <br />
              <span className="text-gradient-emerald">Intelligence Platform</span>
            </motion.h1>

            <motion.p
              variants={heroItem}
              className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-zinc-400"
            >
              A production-grade pricing engine for{' '}
              <span className="font-medium text-zinc-200">
                {PROJECT.totalListings.toLocaleString()} NYC listings
              </span>
              . 310 engineered features and a 40-model stacked ensemble that reached a{' '}
              <span className="font-medium text-emerald-400">36.18 MAE</span> — #1 on the
              Kaggle leaderboard.
            </motion.p>

            <motion.div
              variants={heroItem}
              className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Link href="/predict" className="btn-primary w-full sm:w-auto">
                Try Prediction
                <ArrowRight size={16} />
              </Link>
              <Link href="/methodology" className="btn-ghost w-full sm:w-auto">
                View Methodology
              </Link>
            </motion.div>

            <motion.div
              variants={heroItem}
              className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs text-zinc-600"
            >
              <span>{PROJECT.trainRows.toLocaleString()} train rows</span>
              <span className="text-zinc-800">/</span>
              <span>{PROJECT.columns} raw columns</span>
              <span className="text-zinc-800">/</span>
              <span>5-fold OOF stacking</span>
              <span className="text-zinc-800">/</span>
              <span>Huber-loss workhorse</span>
            </motion.div>
          </motion.div>

          {/* ============= STAT CARDS ============= */}
          <div className="mt-16 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              icon={<TargetIcon size={16} />}
              value={PROJECT.mae}
              decimals={2}
              label="Accuracy"
              caption="Kaggle public-leaderboard MAE"
              delay={0}
            />
            <StatCard
              icon={<TrophyIcon size={16} />}
              value={1}
              prefix="#"
              label="Ranking"
              caption="Kaggle competition leaderboard"
              delay={0.08}
            />
            <StatCard
              icon={<LayersIcon size={16} />}
              value={PROJECT.baseModels}
              suffix="+"
              label="Ensemble"
              caption="Stacked base models"
              delay={0.16}
            />
            <StatCard
              icon={<SparkIcon size={16} />}
              value={PROJECT.features}
              label="Signal"
              caption="Engineered features per listing"
              delay={0.24}
            />
          </div>
        </div>
      </section>

      {/* ================= NARRATIVE ================= */}
      <section className="border-t border-white/[0.06] py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
            <Reveal>
              <div>
                <p className="section-eyebrow">The problem</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Pricing is the hardest decision a host makes.
                </h2>
                <p className="mt-5 text-pretty leading-relaxed text-zinc-400">
                  NYC nightly prices are heavily right-skewed — a ${PROJECT.medianPrice}{' '}
                  median against a ${PROJECT.meanPrice} mean and a long luxury tail. With no
                  listing-level coordinates in the data, every geographic signal had to be
                  derived from zip codes alone.
                </p>
                <p className="mt-4 text-pretty leading-relaxed text-zinc-400">
                  This platform turns that messy regression problem into an explainable,
                  interactive product: instant estimates, a transparent driver breakdown,
                  and the full market context behind every number.
                </p>
                <Link
                  href="/methodology"
                  className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
                >
                  How the model works
                  <ArrowUpRight size={15} />
                </Link>
              </div>
            </Reveal>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: <DatabaseIcon size={18} />,
                  title: 'Rich feature engineering',
                  body: 'Amenity flags, geo proximity, TF-IDF & SBERT text embeddings, and OOF target encoding — 310 signals per listing.',
                },
                {
                  icon: <LayersIcon size={18} />,
                  title: '40-model stacked ensemble',
                  body: 'LightGBM-Huber, XGBoost, CatBoost, quantile learners and a Mixture-of-Experts, blended by a Huber stacker.',
                },
                {
                  icon: <RouteIcon size={18} />,
                  title: 'Residual correction',
                  body: 'A second-level LGB-L1 model on stacker outputs — the single biggest stacking win at −0.18 MAE.',
                },
                {
                  icon: <BoltIcon size={18} />,
                  title: 'Honest validation',
                  body: 'Host-ID leakage diagnosed with GroupKFold: random-KFold OOF was optimistic by ~1.9 MAE.',
                },
              ].map((f, i) => (
                <Reveal key={f.title} delay={i * 0.07}>
                  <div className="card card-hover h-full p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      {f.icon}
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-white">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{f.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= MAE TIMELINE ================= */}
      <section className="border-t border-white/[0.06] py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-eyebrow">Model evolution</p>
                <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  From 36.83 to a leaderboard-topping result.
                </h2>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2.5 text-emerald-300">
                <TrendDown size={16} />
                <span className="font-mono text-sm font-semibold">−1.26 MAE improvement</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="card mt-8 p-5 sm:p-7">
              <MaeTimeline
                height={340}
                domain={[35, 37.3]}
                refs={[
                  { y: PROJECT.mae, label: 'Kaggle public LB 36.18', color: '#34d399' },
                ]}
              />
              <p className="mt-4 border-t border-white/[0.06] pt-4 text-sm text-zinc-500">
                Out-of-fold MAE across seven development rounds. The final random-KFold
                pipeline scored{' '}
                <span className="font-mono font-medium text-emerald-400">
                  {PROJECT.maeFull}
                </span>{' '}
                on the Kaggle public leaderboard.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= EXPLORE ================= */}
      <section className="border-t border-white/[0.06] py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <p className="section-eyebrow">Explore the platform</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Three ways in.
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                href: '/predict',
                icon: <TargetIcon size={20} />,
                title: 'Price Prediction',
                body: 'Configure a listing and get an instant nightly estimate with a transparent price-driver breakdown.',
                cta: 'Run a prediction',
              },
              {
                href: '/dashboard',
                icon: <ChartIcon size={20} />,
                title: 'Market Dashboard',
                body: 'NYC heatmaps, room-type distributions, per-tier error analysis and the full OOF trajectory.',
                cta: 'Open the dashboard',
              },
              {
                href: '/methodology',
                icon: <CpuIcon size={20} />,
                title: 'Methodology',
                body: 'The full pipeline — feature groups, model architecture, and the techniques that moved the metric.',
                cta: 'Read the methodology',
              },
            ].map((c, i) => (
              <Reveal key={c.href} delay={i * 0.08}>
                <Link href={c.href} className="group block h-full">
                  <div className="card card-hover flex h-full flex-col p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition-colors group-hover:bg-emerald-500/20">
                      {c.icon}
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-white">{c.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-500">
                      {c.body}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                      {c.cta}
                      <ArrowRight
                        size={15}
                        className="transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="border-t border-white/[0.06] py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/15 bg-gradient-to-b from-emerald-500/[0.08] to-transparent px-6 py-14 text-center sm:px-12 sm:py-20">
              <div className="pointer-events-none absolute inset-0 bg-dots opacity-40 mask-fade-b" />
              <div className="relative">
                <MapPinIcon size={28} className="mx-auto text-emerald-400" />
                <h2 className="mx-auto mt-5 max-w-xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Estimate any NYC listing in seconds.
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-pretty text-zinc-400">
                  Plug in a neighborhood, room type and amenities — the engine returns a
                  price, a confidence band and the reasons behind it.
                </p>
                <Link href="/predict" className="btn-primary mt-8 inline-flex">
                  Try Prediction
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
