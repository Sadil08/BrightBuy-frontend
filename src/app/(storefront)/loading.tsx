// Shown instantly while a storefront page's server data loads (Next.js wraps the page in Suspense with
// this as the fallback), so navigation never feels frozen. Deliberately neutral (a heading and two
// panels) because it is shared by every storefront route: a grid of product cards would look wrong
// while an order or the checkout loads.
export default function Loading() {
  return (
    <main className="container-page py-10" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton mt-4 h-11 w-72 max-w-full" />
      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="skeleton h-80 w-full" />
        <div className="skeleton h-56 w-full" />
      </div>
    </main>
  );
}
