"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import type { ItemFormState } from "@/lib/actions/menu";

type Category = { id: string; name: string };
type Variant = { name: string; price_paise: number };
type Values = {
  id?: string;
  name?: string;
  description?: string | null;
  price_paise?: number;
  is_available?: boolean;
  category_id?: string | null;
  variants?: Variant[];
};

type SizeRow = { name: string; price: string };

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

  const [sizes, setSizes] = useState<SizeRow[]>(
    values?.variants?.map((v) => ({
      name: v.name,
      price: String(v.price_paise / 100),
    })) ?? [],
  );

  function updateSize(i: number, field: keyof SizeRow, val: string) {
    setSizes((prev) => prev.map((s, j) => (j === i ? { ...s, [field]: val } : s)));
  }

  const variantsPayload = JSON.stringify(
    sizes.filter((s) => s.name.trim() && s.price.trim() !== ""),
  );

  return (
    <form action={formAction} className="space-y-4">
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="variants" value={variantsPayload} />

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
        <Field
          label="Price (₹)"
          htmlFor="price_rupees"
          error={fe.price_rupees}
          hint={sizes.length > 0 ? "Used only if no sizes are set." : undefined}
        >
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

      {/* Size variants */}
      <div className="rounded-xl border border-border p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Sizes (optional)</p>
          <button
            type="button"
            onClick={() => setSizes((s) => [...s, { name: "", price: "" }])}
            className="text-xs font-medium text-primary hover:underline"
          >
            + Add size
          </button>
        </div>
        {sizes.length === 0 ? (
          <p className="mt-1.5 text-xs text-muted">
            No sizes — the item uses the price above. Add sizes (e.g. Small,
            Large) to let customers pick one.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {sizes.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={s.name}
                  onChange={(e) => updateSize(i, "name", e.target.value)}
                  placeholder="Size (e.g. Large)"
                  maxLength={40}
                  className="h-9 flex-1"
                />
                <Input
                  value={s.price}
                  onChange={(e) => updateSize(i, "price", e.target.value)}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="₹"
                  className="h-9 w-20"
                />
                <button
                  type="button"
                  onClick={() => setSizes(sizes.filter((_, j) => j !== i))}
                  aria-label="Remove size"
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-danger-bg hover:text-danger"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
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
