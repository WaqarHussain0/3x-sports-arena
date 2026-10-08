import type { ReactNode } from 'react';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function ChartCard({
  title,
  description,
  children,
  empty,
  emptyMessage = 'No data for this period',
  className,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
}) {
  return (
    <Card className={cn('min-w-0', className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {empty ? (
          <div className="flex h-56 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="size-6 opacity-50" />
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
