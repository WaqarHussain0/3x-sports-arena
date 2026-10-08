import type { Metadata } from 'next';
import { BookingsView } from '@/components/bookings/BookingsView';

export const metadata: Metadata = { title: 'Bookings' };

export default function BookingsPage() {
  return <BookingsView />;
}
