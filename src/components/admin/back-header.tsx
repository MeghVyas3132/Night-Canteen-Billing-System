import Link from "next/link";

export function BackHeader({ title }: { title: string }) {
  return (
    <div className="mb-4">
      <Link
        href="/admin/menu"
        className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Menu
      </Link>
      <h1 className="mt-1 text-xl font-semibold text-foreground">{title}</h1>
    </div>
  );
}
