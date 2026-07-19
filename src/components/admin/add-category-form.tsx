"use client";

import { useActionState, useState } from "react";
import { createCategory, type CategoryFormState } from "@/lib/actions/menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: CategoryFormState = { error: null };

export function AddCategoryForm() {
  const [state, action, pending] = useActionState(createCategory, initial);
  const [name, setName] = useState("");

  // Clear the field after a successful add. Adjusting state during render (when
  // the action result changes) is the React-recommended pattern — not an effect.
  const [seen, setSeen] = useState(state);
  if (seen !== state) {
    setSeen(state);
    if (state.ok) setName("");
  }

  return (
    <form action={action} className="flex items-start gap-2">
      <div className="flex-1">
        <Input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="New category (e.g. Wraps)"
          aria-label="New category name"
        />
        {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
      </div>
      <Button type="submit" variant="secondary" loading={pending}>
        Add
      </Button>
    </form>
  );
}
