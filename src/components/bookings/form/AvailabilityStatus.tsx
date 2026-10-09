import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { AvailabilityState } from "./use-slot-availability";

export function AvailabilityStatus({ state }: { state: AvailabilityState }) {
  if (state.kind === "idle") return null;

  return (
    <div aria-live="polite" className="text-sm">
      {state.kind === "conflict" ? (
        <p className="flex items-center gap-1.5 text-destructive">
          <XCircle className="size-4" /> {state.message}
        </p>
      ) : state.kind === "checking" ? (
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Checking availability…
        </p>
      ) : (
        <p className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-4" /> Slot available
        </p>
      )}
    </div>
  );
}
