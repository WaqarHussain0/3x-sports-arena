import type { Metadata } from 'next';
import { CourtsView } from '@/components/courts/CourtsView';

export const metadata: Metadata = { title: 'Courts' };

export default function CourtsPage() {
  return <CourtsView />;
}
