import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** A titled card that groups related booking-form fields. */
export function FormSection({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border bg-card shadow-xs", className)}>
      <header className="flex items-center gap-2 border-b px-4 py-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm leading-8 font-semibold">{title}</h3>
          {description && (
            <p className="-mt-1 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </header>
      <div className="grid gap-4 p-4">{children}</div>
    </section>
  );
}
