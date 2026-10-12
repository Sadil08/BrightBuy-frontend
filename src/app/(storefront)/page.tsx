import Link from "next/link";
import { getCategories, getProducts } from "@/lib/api-client/catalog";
import { ProductImage } from "@/components/ProductImage";
import { ShieldIcon, SparkleIcon, StoreIcon, TruckIcon, ChevronRightIcon } from "@/components/icons";
import { ProductCard } from "./_components/ProductCard";

// The landing page reads real data (categories and the newest products) so it is never a mock-up of
// the shop, it IS the shop's front window. Both fetches run in parallel.
// Where the three hero cards sit inside their box (a loose, overlapping fan).
const SPOTLIGHT_SLOTS: React.CSSProperties[] = [
  { left: "0%", top: "2%", width: "55%", height: "56%", transform: "rotate(-3deg)" },
  { right: "0%", top: "12%", width: "41%", height: "46%", transform: "rotate(4deg)" },
  { left: "27%", bottom: "0%", width: "52%", height: "37%", transform: "rotate(-1.5deg)" },
];

export default async function Home() {
  const [categories, featured] = await Promise.all([getCategories(), getProducts({ size: 8 })]);
  // Prefer products that have a real photo for the hero; top up with whatever else is newest.
  const withPhoto = featured.items.filter((p) => p.imageUrl);
  const rest = featured.items.filter((p) => !p.imageUrl);
  const spotlight = [...withPhoto, ...rest].slice(0, 3);

  return (
    <main>
      {/* Hero: the thesis in one screen. A soft aurora behind it and a frosted "ask" bar give it a
          modern, assistant-like feel; the bar is an ordinary GET search form, so it also works
          without JavaScript. */}
      <section className="relative isolate">
        <div className="aurora" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="container-page grid grid-cols-[minmax(0,1fr)] items-center gap-12 pb-16 pt-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:pt-20">
          <div className="rise">
            <p className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.8rem] font-semibold text-ink-soft">
              <SparkleIcon className="text-action" /> Electronics &amp; toys, across Texas
            </p>
            <h1 className="mt-6 text-[clamp(2.7rem,6vw,4.7rem)] leading-[1.02]">
              Thoughtful gear,
              <br />
              <em className="shimmer-text pr-1">delightful</em> toys.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-ink-soft">
              Tell us what you&apos;re after and we&apos;ll find it. Pick it up in store today, or have it at your
              door in five to seven days.
            </p>

            <form action="/products" method="GET" role="search" className="glass mt-8 flex max-w-xl items-center gap-2 rounded-full p-1.5 pl-5">
              <label htmlFor="hero-q" className="sr-only">What are you looking for?</label>
              <SparkleIcon className="text-action" />
              <input
                id="hero-q"
                type="search"
                name="q"
                placeholder="Try “headphones for long flights”"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-[0.98rem] text-ink outline-none placeholder:text-ink-faint"
              />
              <button type="submit" className="btn btn-primary !py-2.5">Find it</button>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-ink-faint">Popular:</span>
              {["Laptops", "Headphones", "Building sets"].map((term) => (
                <Link key={term} href={`/products?q=${encodeURIComponent(term)}`} className="chip no-underline !py-1 !text-[0.82rem]">
                  {term}
                </Link>
              ))}
            </div>
          </div>

          {/* Real products from the shop, floating on frosted cards. Falls back to generated art
              when a product has no photo, and to a plain art collage on a brand-new empty shop. */}
          <div className="relative mx-auto h-[24rem] w-full max-w-lg sm:h-[28rem]" aria-hidden="true">
            {spotlight.map((product, i) => (
              <Link
                key={product.productId}
                href={`/products/${product.productId}`}
                tabIndex={-1}
                className="glass absolute overflow-hidden rounded-3xl p-2 no-underline transition duration-300 hover:-translate-y-1"
                style={SPOTLIGHT_SLOTS[i]}
              >
                <div className="relative h-full w-full overflow-hidden rounded-[1.1rem] bg-surface-2">
                  <ProductImage
                    src={product.imageUrl}
                    productId={product.productId}
                    name={product.name}
                    eager
                    className="h-full w-full"
                  />
                  <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-xl bg-white/80 px-2.5 py-1.5 text-[0.78rem] font-semibold text-ink backdrop-blur">
                    <span className="truncate">{product.name}</span>
                    <span className="num shrink-0 text-ink-soft">${product.priceFrom}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How shopping here works, grounded in the real delivery rules. */}
      <section className="border-y border-line bg-surface">
        <div className="container-page grid gap-6 py-8 sm:grid-cols-3">
          {[
            { icon: <StoreIcon className="h-7 w-7" />, title: "Pick up today", body: "Store pickup is ready the same day when every item is in stock." },
            { icon: <TruckIcon className="h-7 w-7" />, title: "Delivered across Texas", body: "Five days to the main cities, seven elsewhere. You see the date before you pay." },
            { icon: <ShieldIcon className="h-7 w-7" />, title: "No double charges", body: "Press confirm twice and you still get one order. Your cart stays put if anything fails." },
          ].map((item) => (
            <div key={item.title} className="flex gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-action-soft text-action">{item.icon}</span>
              <div>
                <h2 className="text-lg">{item.title}</h2>
                <p className="mt-1 text-sm text-ink-soft">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="container-page pt-12" aria-labelledby="categories-h">
          <h2 id="categories-h" className="text-2xl">Shop by category</h2>
          {/* One swipeable row: scrolls sideways on phones and narrow windows, wraps nowhere. The
              right-edge fade hints that there is more to scroll to. */}
          <div className="relative mt-4">
            <ul className="no-scrollbar -mx-5 flex snap-x scroll-px-5 gap-2.5 overflow-x-auto px-5 pb-2">
              <li className="shrink-0 snap-start">
                <Link href="/products" className="chip whitespace-nowrap no-underline !px-5 !py-2.5 !text-[0.95rem]">All products</Link>
              </li>
              {categories.map((category) => (
                <li key={category.categoryId} className="shrink-0 snap-start">
                  <Link
                    href={`/products?categoryId=${category.categoryId}`}
                    className="chip whitespace-nowrap no-underline !px-5 !py-2.5 !text-[0.95rem] hover:!border-action hover:!bg-action-soft hover:!text-action"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="pointer-events-none absolute inset-y-0 -right-5 w-12 bg-gradient-to-l from-paper to-transparent" aria-hidden="true" />
          </div>
        </section>
      )}

      <section className="container-page pt-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl">Just in</h2>
          <Link href="/products" className="inline-flex items-center gap-1 text-sm font-bold no-underline">
            See all <ChevronRightIcon />
          </Link>
        </div>
        {featured.items.length === 0 ? (
          <p className="mt-6 text-ink-soft">New products are on their way.</p>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.items.map((product) => (
              <li key={product.productId}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
