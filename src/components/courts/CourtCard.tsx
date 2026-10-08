'use client';

import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArchivedBadge } from '@/components/shared/StatusBadge';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { CourtDTO } from '@/types';

export function CourtCard({
  court,
  onEdit,
  onToggleArchive,
  onDelete,
}: {
  court: CourtDTO;
  onEdit: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
}) {
  const canDelete = court.bookingCount === 0;

  return (
    <Card className={cn('relative overflow-hidden', court.isArchived && 'opacity-70')}>
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: court.color }} />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: court.color }} />
          <span className="truncate">{court.name}</span>
        </CardTitle>
        <CardDescription className="line-clamp-2 min-h-5">{court.description || 'No description'}</CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${court.name}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onToggleArchive}>
                {court.isArchived ? <ArchiveRestore /> : <Archive />}
                {court.isArchived ? 'Unarchive' : 'Archive'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canDelete ? (
                <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                  <Trash2 /> Delete
                </DropdownMenuItem>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <DropdownMenuItem disabled>
                        <Trash2 /> Delete
                      </DropdownMenuItem>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">Courts with bookings can only be archived</TooltipContent>
                </Tooltip>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-2xl font-semibold tabular-nums">
          {formatCurrency(court.pricePerHour)}
          <span className="text-sm font-normal text-muted-foreground"> / hour</span>
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">{court.bookingsThisMonth}</span> bookings this month
          </span>
          <ArchivedBadge archived={court.isArchived} />
        </div>
      </CardContent>
    </Card>
  );
}
