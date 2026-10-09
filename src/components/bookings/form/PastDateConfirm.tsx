"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function PastDateConfirm({
  confirmed,
  onConfirmedChange,
}: {
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
}) {
  return (
    <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
      <AlertTriangle />
      <AlertDescription className="text-inherit">
        <p>
          This date is in the past. Only continue if you are back-entering a
          booking.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Checkbox
            id="confirm-past"
            checked={confirmed}
            onCheckedChange={(c) => onConfirmedChange(c === true)}
          />
          <Label htmlFor="confirm-past" className="font-normal">
            Yes, record a past booking
          </Label>
        </div>
      </AlertDescription>
    </Alert>
  );
}
