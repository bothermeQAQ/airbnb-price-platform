import Link from 'next/link';
import { Logo } from './Logo';
import { EnsembleBadge } from './EnsembleBadge';
import { PROJECT } from '@/lib/data';

export function Footer() {
  return (
    <footer className="border-t border-white/[0.07] bg-ink-950">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo />
              <span className="text-[15px] font-semibold tracking-tight text-white">
                PriceIQ
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-zinc-500">
              Nightly price intelligence for NYC Airbnb listings. A 40-model stacked
              ensemble that scored {PROJECT.maeFull.toFixed(2)} MAE on the Kaggle
              leaderboard.
            </p>
            <div className="mt-5">
              <EnsembleBadge />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <FooterCol
              title="Platform"
              links={[
                { href: '/', label: 'Overview' },
                { href: '/predict', label: 'Price Prediction' },
                { href: '/dashboard', label: 'Market Dashboard' },
                { href: '/methodology', label: 'Methodology' },
              ]}
            />
            <FooterCol
              title="Model"
              links={[
                { href: '/methodology', label: 'Architecture' },
                { href: '/dashboard', label: 'Performance' },
                { href: '/methodology', label: 'Feature Groups' },
              ]}
            />
            <div>
              <h4 className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-600">
                Resources
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a
                    href={PROJECT.github}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-400 transition-colors hover:text-emerald-400"
                  >
                    GitHub Repository
                  </a>
                </li>
                <li>
                  <span className="text-zinc-400">Kaggle Competition</span>
                </li>
                <li>
                  <span className="text-zinc-400">Technical Summary</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.06] pt-6 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PriceIQ — Airbnb Price Intelligence Platform.</p>
          <p className="font-mono">
            Kaggle MAE {PROJECT.maeFull} · OOF {PROJECT.oofBest} · {PROJECT.baseModels} models
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-600">{title}</h4>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-zinc-400 transition-colors hover:text-emerald-400"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
