import Link from "next/link";

// 01-catalog's real homepage: previously just a "Phase 0 proves the app boots" placeholder. Kept
// deliberately simple — a storefront landing page with a hero/featured-products section isn't
// anything 01-catalog's spec actually asks for (browse/search/detail are the three in-scope
// endpoints); this just makes the catalog actually reachable from the root URL, which the
// placeholder it replaced didn't do at all.
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-semibold">BrightBuy</h1>
      <p className="mt-2 text-zinc-500">Electronics and toys, online.</p>
      <Link
        href="/products"
        className="mt-6 rounded bg-zinc-900 px-5 py-2.5 text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        Browse products
      </Link>
    </main>
  );
}
