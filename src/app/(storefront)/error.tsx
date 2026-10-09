"use client";

// A friendly page for an unexpected failure (e.g. the shop backend is unreachable), instead of a raw
// framework error screen. `reset` re-renders the segment, so "Try again" often just works.
export default function StorefrontError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container-page grid place-items-center py-24 text-center">
      <div className="max-w-md">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-3 text-4xl font-extrabold">We couldn&apos;t load that page.</h1>
        <p className="mt-4 text-ink-soft">
          The shop is having trouble reaching its data. Nothing you did caused this, and your cart is safe.
        </p>
        <button type="button" className="btn btn-primary btn-lg mt-8" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
