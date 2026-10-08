import { Building2, Goal, Volleyball } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { label, type ExpenseSportType } from '@/lib/constants';
import { cn } from '@/lib/utils';

const STYLES: Record<ExpenseSportType, string> = {
  cricket: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
  futsal: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  general: 'bg-muted text-muted-foreground',
};

export const SPORT_ICONS = { cricket: Volleyball, futsal: Goal, general: Building2 } as const;

export function SportBadge({ sport, className }: { sport: ExpenseSportType; className?: string }) {
  const Icon = SPORT_ICONS[sport];
  return (
    <Badge variant="secondary" className={cn(STYLES[sport], className)}>
      <Icon data-icon="inline-start" />
      {label(sport)}
    </Badge>
  );
}
