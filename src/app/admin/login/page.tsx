import { LoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-full items-center justify-center bg-primary-deep px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex items-center gap-2.5 text-on-primary">
          <svg
            viewBox="0 0 24 24"
            className="size-6 text-accent"
            fill="currentColor"
            aria-hidden
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
          </svg>
          <span className="font-display text-xl font-semibold tracking-tight">
            Night Canteen
          </span>
        </div>

        <div className="rounded-2xl bg-surface p-6 shadow-float">
          <h1 className="text-lg font-semibold text-foreground">Staff sign in</h1>
          <p className="mb-5 mt-1 text-sm text-muted">
            Manage the menu and live orders.
          </p>
          <LoginForm next={next} />
        </div>

        <p className="mt-5 text-center text-xs text-on-primary/60">
          Authorized staff only
        </p>
      </div>
    </div>
  );
}
