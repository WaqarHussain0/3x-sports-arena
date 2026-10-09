"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EXPENSE_SPORT_TYPES,
  label,
  type ExpenseSportType,
} from "@/lib/constants";
import { applyServerErrors } from "@/lib/form";
import { categoryDescriptionRules, categoryNameRules } from "@/lib/validators";
import {
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
} from "@/store/api/expenseCategoriesApi";
import type { ExpenseCategoryDTO } from "@/types";

interface CategoryFormValues {
  name: string;
  sportType: ExpenseSportType;
  description: string;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: ExpenseCategoryDTO | null;
  onSaved?: (category: ExpenseCategoryDTO) => void;
}) {
  const isEdit = !!category;
  const [createCategory] = useCreateExpenseCategoryMutation();
  const [updateCategory] = useUpdateExpenseCategoryMutation();

  const form = useForm<CategoryFormValues>({
    mode: "onTouched",
    defaultValues: { name: "", sportType: "general", description: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: category?.name ?? "",
        sportType: category?.sportType ?? "general",
        description: category?.description ?? "",
      });
    }
  }, [open, category, form]);

  async function onSubmit(values: CategoryFormValues) {
    const payload = {
      name: values.name.trim(),
      sportType: values.sportType,
      description: values.description.trim(),
    };
    try {
      const saved = isEdit
        ? await updateCategory({ id: category._id, ...payload }).unwrap()
        : await createCategory(payload).unwrap();

      toast.success("Request successful", {
        description: isEdit ? "Category updated" : "Category added",
      });

      onSaved?.(saved);
      onOpenChange(false);
    } catch (error) {
      applyServerErrors(error, form.setError, { nameLower: "name" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "Add category"}</DialogTitle>
          <DialogDescription>
            Group expenses and tag them with the sport they belong to.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          {/* stopPropagation: this dialog can open inside the expense form without submitting it. */}
          <form
            onSubmit={(e) => {
              e.stopPropagation();
              return form.handleSubmit(onSubmit)(e);
            }}
            className="grid gap-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="name"
              rules={categoryNameRules}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Cricket Balls" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sportType"
              rules={{ required: "Sport type is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sport type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXPENSE_SPORT_TYPES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {label(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              rules={categoryDescriptionRules}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="animate-spin" />
                )}
                {isEdit ? "Save changes" : "Add category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
