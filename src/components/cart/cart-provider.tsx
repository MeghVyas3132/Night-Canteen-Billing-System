"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

export type CartLine = {
  id: string; // menu_item id
  variantId: string | null; // size variant, or null
  name: string; // display name (item, or "item — size")
  price_paise: number;
  qty: number;
};

export type AddItem = {
  id: string;
  variantId?: string | null;
  name: string;
  price_paise: number;
};

/** Composite key so each item+size is its own line. */
export const lineKey = (id: string, variantId: string | null) =>
  `${id}::${variantId ?? ""}`;

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotalPaise: number;
  hydrated: boolean;
  qtyOf: (id: string, variantId?: string | null) => number;
  qtyOfItem: (id: string) => number;
  add: (item: AddItem) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "nc_cart_v2";
const MAX_QTY = 50;
const EMPTY: CartLine[] = [];

// ---- Module-level store (localStorage-backed, useSyncExternalStore source) ---
let cartLines: CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function loadOnce() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) cartLines = parsed;
    }
  } catch {
    // ignore malformed / unavailable storage
  }
}

function commit(next: CartLine[]) {
  cartLines = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / availability errors
  }
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function getSnapshot() {
  loadOnce();
  return cartLines;
}
function getServerSnapshot() {
  return EMPTY;
}

function addLine(item: AddItem) {
  loadOnce();
  const variantId = item.variantId ?? null;
  const existing = cartLines.find(
    (l) => l.id === item.id && l.variantId === variantId,
  );
  commit(
    existing
      ? cartLines.map((l) =>
          l.id === item.id && l.variantId === variantId
            ? { ...l, qty: Math.min(l.qty + 1, MAX_QTY) }
            : l,
        )
      : [...cartLines, { id: item.id, variantId, name: item.name, price_paise: item.price_paise, qty: 1 }],
  );
}
function setLineQty(key: string, qty: number) {
  loadOnce();
  commit(
    qty <= 0
      ? cartLines.filter((l) => lineKey(l.id, l.variantId) !== key)
      : cartLines.map((l) =>
          lineKey(l.id, l.variantId) === key
            ? { ...l, qty: Math.min(qty, MAX_QTY) }
            : l,
        ),
  );
}
function removeLine(key: string) {
  loadOnce();
  commit(cartLines.filter((l) => lineKey(l.id, l.variantId) !== key));
}
function clearLines() {
  commit([]);
}

const noopSubscribe = () => () => {};
const getTrue = () => true;
const getFalse = () => false;

// ---- React context ----------------------------------------------------------
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(noopSubscribe, getTrue, getFalse);

  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines]);
  const subtotalPaise = useMemo(
    () => lines.reduce((s, l) => s + l.price_paise * l.qty, 0),
    [lines],
  );
  const qtyOf = useCallback(
    (id: string, variantId: string | null = null) =>
      lines.find((l) => l.id === id && l.variantId === variantId)?.qty ?? 0,
    [lines],
  );
  const qtyOfItem = useCallback(
    (id: string) =>
      lines.reduce((n, l) => (l.id === id ? n + l.qty : n), 0),
    [lines],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count,
      subtotalPaise,
      hydrated,
      qtyOf,
      qtyOfItem,
      add: addLine,
      setQty: setLineQty,
      remove: removeLine,
      clear: clearLines,
    }),
    [lines, count, subtotalPaise, hydrated, qtyOf, qtyOfItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
