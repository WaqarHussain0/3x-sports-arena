/** Minimal accessible progress bar (no extra shadcn component needed). */
export function Progress({ value, color, label }: { value: number; color?: string; label: string }) {
  const pct = Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
    >
      <div
        className="h-full rounded-full transition-[width]"
        style={{ width: `${pct}%`, backgroundColor: color ?? 'var(--primary)' }}
      />
    </div>
  );
}
