import Link from 'next/link';
import { ArrowRight } from '@/components/Icons';

export default function NotFound() {
  return (
    <section className="relative flex min-h-[80vh] items-center justify-center px-5">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid mask-radial opacity-50" />
      <div className="text-center">
        <p className="font-mono text-7xl font-bold text-gradient-emerald">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-white">Page not found</h1>
        <p className="mt-2 text-zinc-500">
          That route isn&apos;t part of the platform.
        </p>
        <Link href="/" className="btn-primary mt-7 inline-flex">
          Back to overview
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
