import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { getErrorMessage, isAppError } from "@/store/api/baseApi";

/**
 * Maps server `error.fields` back onto the form with `setError` and toasts the server message.
 * `fieldMap` renames server field keys to form field names where they differ.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldMap: Record<string, Path<T>> = {},
) {
  if (isAppError(error) && error.fields) {
    for (const [key, message] of Object.entries(error.fields)) {
      const name = (fieldMap[key] ?? key) as Path<T>;
      setError(name, { type: "server", message });
    }
  }
  toast.error("Request failed.", { description: getErrorMessage(error) });
}
