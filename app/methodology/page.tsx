import type { Metadata } from 'next';
import { MethodologyPage } from '@/components/pages/MethodologyPage';

export const metadata: Metadata = {
  title: 'Methodology',
  description:
    'The full ML pipeline — feature groups, 40-model architecture, stacking, and the techniques that moved the MAE.',
};

export default function Page() {
  return <MethodologyPage />;
}
