import Link from "next/link";
import { getCategories, getProducts } from "@/lib/api-client/catalog";
import { ProductArt } from "@/components/ProductArt";
import { ShieldIcon, StoreIcon, TruckIcon, ChevronRightIcon } from "@/components/icons";
import { PriceTag } from "./_components/PriceTag";
import { ProductCard } from "./_components/ProductCard";

// The landing page reads real data (categories and the newest products) so it is never a mock-up of
// the shop, it IS the shop's front window. Both fetches run in parallel.
export default async function Home() {
  const [categories, featured] = await Promise.all([getCategories(), getProducts({ size: 8 })]);

  return (
    <main>
      {/* Hero: the thesis in one screen — what we sell, how fast it gets to you. */}
      <section className="container-page grid grid-cols-[minmax(0,1fr)] items-center gap-10 pb-14 pt-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:pt-16">
        <div className="rise">
          <p className="eyebrow">Electronics &amp; toys · Texas</p>
          <h1 className="mt-4 text-[clamp(2.6rem,6vw,4.6rem)] font-extrabold leading-[0.98]">
            Gear you&apos;ll use.
            <br />
            Toys they&apos;ll <span className="relative whitespace-nowrap">love<span className="absolute -bottom-1 left-0 h-[0.28em] w-full -skew-x-12 bg-tag" aria-hidden="true" style={{ zIndex: -1 }} /></span>.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-ink-soft">
            Pick it up in store the same day, or have it at your door in five to seven days. Real stock,
            honest prices, no surprises at checkout.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/products" className="btn btn-primary btn-lg">
              Shop everything
            </Link>
            {categories[0] && (
              <Link href={`/products?categoryId=${categories[0].categoryId}`} className="btn btn-outline btn-lg">
                {categories[0].name}
              </Link>
            )}
          </div>
        </div>

        {/* Decorative collage of the generated product art, on an explicit 6x6 grid so every tile
            has a real size (no aspect-ratio guessing). */}
        <div
          className="relative mx-auto grid h-[22rem] w-full max-w-lg gap-3 sm:h-[26rem] sm:gap-4"
          style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gridTemplateRows: "repeat(6, minmax(0, 1fr))" }}
          aria-hidden="true"
        >
          <div className="card overflow-hidden shadow-lift" style={{ gridColumn: "1 / 5", gridRow: "1 / 5" }}>
            <ProductArt seed={0} label="BrightBook" className="h-full w-full" />
          </div>
          <div className="card overflow-hidden" style={{ gridColumn: "5 / 7", gridRow: "1 / 4" }}>
            <ProductArt seed={7} label="Beam" className="h-full w-full" letters={false} />
          </div>
          <div className="card overflow-hidden shadow-lift" style={{ gridColumn: "5 / 7", gridRow: "4 / 7" }}>
            <ProductArt seed={3} label="Pad" className="h-full w-full" letters={false} />
          </div>
          <div className="card overflow-hidden" style={{ gridColumn: "1 / 5", gridRow: "5 / 7" }}>
            <ProductArt seed={14} label="Blocks" className="h-full w-full" letters={false} />
          </div>
          <div className="absolute -left-3 top-5 rotate-[-6deg]">
            <PriceTag value="799.00" from size="lg" />
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
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-action-soft text-action">{item.icon}</span>
              <div>
                <h2 className="text-lg font-bold">{item.title}</h2>
                <p className="mt-1 text-sm text-ink-soft">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="container-page pt-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl font-extrabold">Shop by category</h2>
            <Link href="/products" className="inline-flex items-center gap-1 text-sm font-bold no-underline">
              All products <ChevronRightIcon />
            </Link>
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.slice(0, 8).map((category) => (
              <li key={category.categoryId}>
                <Link
                  href={`/products?categoryId=${category.categoryId}`}
                  className="group card relative flex aspect-[4/3] flex-col justify-end overflow-hidden no-underline transition duration-200 hover:-translate-y-1 hover:shadow-lift"
                >
                  <ProductArt
                    seed={category.categoryId * 5 + 2}
                    label={category.name}
                    className="absolute inset-0 h-full w-full transition duration-300 group-hover:scale-105"
                    letters={false}
                  />
                  <span className="relative m-3 self-start rounded-lg bg-paper px-3 py-1.5 font-display text-base font-extrabold text-ink">
                    {category.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="container-page pt-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-extrabold">Just in</h2>
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
