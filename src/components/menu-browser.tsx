"use client";

import { useState } from "react";
import { AddToCart } from "@/components/cart/add-to-cart";
import { SizePicker } from "@/components/cart/size-picker";
import { formatPaise } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { MenuCategoryWithItems, MenuItem } from "@/lib/menu";

/** Customer menu with a sticky "All + categories" filter below the hero. */
export function MenuBrowser({
  categories,
}: {
  categories: MenuCategoryWithItems[];
}) {
  const [selected, setSelected] = useState<string>("all");
  const shown =
    selected === "all"
      ? categories
      : categories.filter((c) => c.id === selected);

  return (
    <div>
      <div className="sticky top-0 z-20 bg-background px-6 pb-3 pt-5">
        <div className="mx-auto flex max-w-lg gap-2 overflow-x-auto no-scrollbar">
          <Pill active={selected === "all"} onClick={() => setSelected("all")}>
            All
          </Pill>
          {categories.map((c) => (
            <Pill
              key={c.id}
              active={selected === c.id}
              onClick={() => setSelected(c.id)}
            >
              {c.name}
            </Pill>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-10 px-6 pt-3">
        {shown.map((category, i) => (
          <section
            key={category.id}
            className="animate-enter"
            style={{ animationDelay: `${Math.min(i, 6) * 55}ms` }}
          >
            <div className="mb-1 flex items-baseline gap-3">
              <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
                {category.name}
              </h2>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="divide-y divide-border">
              {category.items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-[transform,background-color,color] duration-150 ease-[var(--ease-out-quart)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        active
          ? "bg-primary text-on-primary"
          : "border border-border bg-surface text-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ItemRow({ item }: { item: MenuItem }) {
  const soldOut = !item.is_available;
  const hasVariants = item.variants.length > 0;
  const availablePrices = item.variants
    .filter((v) => v.is_available)
    .map((v) => v.price_paise);
  const fromPrice = availablePrices.length
    ? Math.min(...availablePrices)
    : item.variants.length
      ? Math.min(...item.variants.map((v) => v.price_paise))
      : item.price_paise;

  return (
    <div className="flex items-start justify-between gap-5 py-4">
      <div className={cn("min-w-0 pt-0.5", soldOut && "opacity-55")}>
        <h3 className="text-[15px] font-medium leading-snug text-foreground">
          {item.name}
        </h3>
        {item.description && (
          <p className="mt-1 text-sm leading-snug text-muted">
            {item.description}
          </p>
        )}
        <p className="mt-1.5 text-sm font-medium tabular-nums text-foreground">
          {hasVariants && <span className="text-muted">from </span>}
          {formatPaise(hasVariants ? fromPrice : item.price_paise)}
        </p>
      </div>
      <div className="shrink-0 pt-0.5">
        {hasVariants ? (
          <SizePicker item={item} />
        ) : (
          <AddToCart
            id={item.id}
            name={item.name}
            pricePaise={item.price_paise}
            available={item.is_available}
          />
        )}
      </div>
    </div>
  );
}
