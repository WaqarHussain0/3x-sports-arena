import { CalendarDays, LayoutDashboard, LandPlot, Receipt, Tags, Users, type LucideIcon } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Bookings', href: '/bookings', icon: CalendarDays },
  { title: 'Courts', href: '/courts', icon: LandPlot },
  { title: 'Customers', href: '/customers', icon: Users },
  { title: 'Expense Categories', href: '/expense-categories', icon: Tags },
  { title: 'Expenses', href: '/expenses', icon: Receipt },
];

export function titleForPath(pathname: string): string {
  const match = NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return match?.title ?? '';
}
