"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renameCategory, deleteCategory } from "@/lib/actions/menu";
import { MoveButtons } from "@/components/admin/move-buttons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CategoryHeader({
  id,
  name,
  count,
  isFirst,
  isLast,
}: {
  id: string;
  name: string;
  count: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [pending, start] = useTransition();
  const router = useRouter();

  function save() {
    start(async () => {
      const res = await renameCategory(id, value);
      if (res.error) {
        window.alert(res.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm(`Delete the "${name}" category?`)) return;
    start(async () => {
      const res = await deleteCategory(id);
      if (res.error) window.alert(res.error);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="mb-2 flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={60}
          autoFocus
          className="h-9"
        />
        <Button size="sm" onClick={save} loading={pending}>
          Save
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setEditing(false);
            setValue(name);
          }}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-2 flex items-center gap-2 px-1">
      <MoveButtons id={id} kind="category" isFirst={isFirst} isLast={isLast} />
      <h2 className="text-base font-semibold text-foreground">{name}</h2>
      <span className="text-xs text-muted">{count}</span>
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          Rename
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-danger-bg hover:text-danger disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
