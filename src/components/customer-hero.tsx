/** Midnight brand hero for the customer flow: wordmark + amber "moon" glow. */
export function CustomerHero() {
  return (
    <header className="bg-primary-deep text-on-primary">
      <div className="mx-auto max-w-lg px-5 pb-9 pt-6">
        <div className="flex items-center gap-2.5">
          <span className="relative grid size-9 place-items-center">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-accent/25 blur-md"
            />
            <svg
              viewBox="0 0 24 24"
              className="relative size-6 text-accent"
              fill="currentColor"
              aria-hidden
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
            </svg>
          </span>
          <span
            title="crafted by Megh Vyas"
            className="font-display text-xl font-semibold tracking-tight"
          >
            Night Canteen
          </span>
        </div>

        <h1 className="mt-7 text-balance font-display text-3xl font-semibold leading-[1.15] tracking-tight">
          Late-night eats,
          <br />
          ready when you are.
        </h1>
        <p className="mt-2 max-w-xs text-sm text-on-primary/75">
          Browse the menu, order from your phone, skip the queue.
        </p>
      </div>
    </header>
  );
}
