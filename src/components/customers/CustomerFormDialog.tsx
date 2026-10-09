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
import { applyServerErrors } from "@/lib/form";
import { normalizePhone } from "@/lib/phone";
import {
  customerNameRules,
  optionalEmailRules,
  phoneRules,
} from "@/lib/validators";
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
} from "@/store/api/customersApi";
import type { CustomerDTO } from "@/types";

interface CustomerFormValues {
  name: string;
  phone: string;
  email: string;
}

const EMPTY: CustomerFormValues = { name: "", phone: "", email: "" };

/** Add a customer, or edit one when `customer` is given. */
export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: CustomerDTO | null;
  onSaved?: (customer: CustomerDTO) => void;
}) {
  const isEdit = !!customer;
  const [createCustomer] = useCreateCustomerMutation();
  const [updateCustomer] = useUpdateCustomerMutation();
  const form = useForm<CustomerFormValues>({
    mode: "onTouched",
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        customer
          ? {
              name: customer.name,
              phone: customer.phone,
              email: customer.email ?? "",
            }
          : EMPTY,
      );
    }
  }, [open, customer, form]);

  async function onSubmit(values: CustomerFormValues) {
    const payload = {
      name: values.name.trim(),
      phone: normalizePhone(values.phone) ?? values.phone,
      email: values.email.trim() || undefined,
    };
    try {
      const saved = isEdit
        ? await updateCustomer({ id: customer._id, ...payload }).unwrap()
        : await createCustomer(payload).unwrap();

      toast.success("Request successful", {
        description: isEdit ? `${saved.name} updated` : `${saved.name} added`,
      });

      onSaved?.(saved);
      onOpenChange(false);
    } catch (error) {
      applyServerErrors(error, form.setError);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit customer" : "Add customer"}</DialogTitle>
          <DialogDescription>
            Each phone number can belong to only one customer.
            {isEdit && " Past bookings keep the details they were made with."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="name"
              rules={customerNameRules}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              rules={phoneRules}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      inputMode="tel"
                      placeholder="0300 1234567"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              rules={optionalEmailRules}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="off" {...field} />
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
                {isEdit ? "Save changes" : "Add customer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
