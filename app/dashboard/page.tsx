import type { Metadata } from 'next';
import { DashboardPage } from '@/components/pages/DashboardPage';

export const metadata: Metadata = {
  title: 'Market Dashboard',
  description:
    'NYC Airbnb pricing geography, distributions, per-tier error analysis and the full OOF MAE trajectory.',
};

export default function Page() {
  return <DashboardPage />;
}
