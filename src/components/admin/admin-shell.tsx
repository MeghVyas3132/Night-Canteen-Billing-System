import * as React from "react";
import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { StoreToggle } from "@/components/admin/store-toggle";
import type { AdminProfile } from "@/lib/admin";

/** Admin app shell: midnight top bar + centered content column. */
export function AdminShell({
  profile,
  storeOpen,
  children,
}: {
  profile: AdminProfile;
  storeOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-primary-deep text-on-primary">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 pt-3">
          <Link href="/admin/orders" className="flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              className="size-5 text-accent"
              fill="currentColor"
              aria-hidden
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
            </svg>
            <span className="font-display text-base font-semibold tracking-tight">
              Night Canteen
            </span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-on-primary/80">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="hidden text-sm text-on-primary/70 md:inline">
              {profile.display_name}
            </span>
            <StoreToggle initialOpen={storeOpen} />
            <form action={signOut}>
              <button className="rounded-lg px-2.5 py-1.5 text-sm text-on-primary/80 transition-colors hover:bg-white/10 hover:text-on-primary">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-3 pb-2 pt-1.5">
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
