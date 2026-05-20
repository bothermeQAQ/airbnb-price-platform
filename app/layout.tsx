import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Airbnb Price Intelligence Platform',
    template: '%s · Price Intelligence',
  },
  description:
    'Production-grade nightly price prediction for NYC Airbnb listings — a 40-model stacked ML ensemble at 36.18 MAE.',
  keywords: [
    'Airbnb',
    'price prediction',
    'machine learning',
    'NYC',
    'ensemble',
    'data science',
  ],
};

export const viewport = {
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-ink-950 font-sans text-zinc-200 antialiased">
        <Nav />
        <main className="relative">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
