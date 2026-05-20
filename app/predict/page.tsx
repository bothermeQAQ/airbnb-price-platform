import type { Metadata } from 'next';
import { PredictPage } from '@/components/pages/PredictPage';

export const metadata: Metadata = {
  title: 'Price Prediction',
  description:
    'Configure a NYC Airbnb listing and get an instant nightly price estimate with a transparent driver breakdown.',
};

export default function Page() {
  return <PredictPage />;
}
