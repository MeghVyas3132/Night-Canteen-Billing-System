"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import type { ItemFormState } from "@/lib/actions/menu";

type Category = { id: string; name: string };
type Values = {
  id?: string;
  name?: string;
  description?: string | null;
  price_paise?: number;
  is_available?: boolean;
  category_id?: string | null;
};

const initial: ItemFormState = { error: null };

export function ItemForm({
  action,
  categories,
  values,
  submitLabel,
}: {
  action: (prev: ItemFormState, fd: FormData) => Promise<ItemFormState>;
  categories: Category[];
  values?: Values;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const router = useRouter();
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {values?.id && <input type="hidden" name="id" value={values.id} />}

      <Field label="Name" htmlFor="name" error={fe.name}>
        <Input
          id="name"
          name="name"
          defaultValue={values?.name ?? ""}
          required
          maxLength={80}
          placeholder="e.g. Cheese Maggi"
        />
      </Field>

      <Field
        label="Description"
        htmlFor="description"
        error={fe.description}
        hint="Optional — a short line customers see under the name."
      >
        <Textarea
          id="description"
          name="description"
          defaultValue={values?.description ?? ""}
          maxLength={280}
          placeholder="Loaded with melted cheese"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (₹)" htmlFor="price_rupees" error={fe.price_rupees}>
          <Input
            id="price_rupees"
            name="price_rupees"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            defaultValue={
              values?.price_paise != null
                ? String(values.price_paise / 100)
                : ""
            }
            required
            placeholder="70"
          />
        </Field>

        <Field label="Category" htmlFor="category_id">
          <Select
            id="category_id"
            name="category_id"
            defaultValue={values?.category_id ?? ""}
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-foreground">
        <input
          type="checkbox"
          name="is_available"
          defaultChecked={values?.is_available ?? true}
          className="size-4 rounded border-border-strong text-primary focus-visible:ring-2 focus-visible:ring-primary/40"
        />
        Available to order
      </label>

      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/admin/menu")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
