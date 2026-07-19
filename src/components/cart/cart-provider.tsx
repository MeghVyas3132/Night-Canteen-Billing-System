"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

export type CartLine = {
  id: string;
  name: string;
  price_paise: number;
  qty: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotalPaise: number;
  hydrated: boolean;
  qtyOf: (id: string) => number;
  add: (item: { id: string; name: string; price_paise: number }) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "nc_cart_v1";
const MAX_QTY = 50;
const EMPTY: CartLine[] = [];

// ---- Module-level store (localStorage-backed) -------------------------------
// A useSyncExternalStore source: SSR-safe (server snapshot is empty), no effects,
// and referentially stable between mutations so React doesn't loop.
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

function addLine(item: { id: string; name: string; price_paise: number }) {
  loadOnce();
  const existing = cartLines.find((l) => l.id === item.id);
  commit(
    existing
      ? cartLines.map((l) =>
          l.id === item.id ? { ...l, qty: Math.min(l.qty + 1, MAX_QTY) } : l,
        )
      : [...cartLines, { ...item, qty: 1 }],
  );
}
function setLineQty(id: string, qty: number) {
  loadOnce();
  commit(
    qty <= 0
      ? cartLines.filter((l) => l.id !== id)
      : cartLines.map((l) =>
          l.id === id ? { ...l, qty: Math.min(qty, MAX_QTY) } : l,
        ),
  );
}
function removeLine(id: string) {
  loadOnce();
  commit(cartLines.filter((l) => l.id !== id));
}
function clearLines() {
  commit([]);
}

// "Am I hydrated" as a store: false on the server, true on the client.
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
    (id: string) => lines.find((l) => l.id === id)?.qty ?? 0,
    [lines],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count,
      subtotalPaise,
      hydrated,
      qtyOf,
      add: addLine,
      setQty: setLineQty,
      remove: removeLine,
      clear: clearLines,
    }),
    [lines, count, subtotalPaise, hydrated, qtyOf],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
