import type { Metadata } from "next";
import Link from "next/link";
import { getProducts } from "@/lib/api-client/catalog";
import { requireToolAccess } from "@/lib/auth/session";
import { formatUsd } from "@/lib/money";
import { ArrowLeftIcon, ChevronRightIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { StockBadge } from "@/app/(storefront)/_components/StockBadge";

export const metadata: Metadata = { title: "Catalogue" };

const PAGE_SIZE = 20;

// The list reads the PUBLIC catalogue endpoint, so a deactivated product disappears from it — which is
// exactly what "deactivate" means (REQ-10.5: hidden from shoppers, kept for past orders).
export default async function CatalogAdminPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requireToolAccess("/admin/catalog");
  const raw = await searchParams;
  const q = (raw.q ?? "").trim();
  const page = Math.max(1, Number(raw.page) || 1);
  const { items, page: info } = await getProducts({ q: q || undefined, page, size: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(info.total / info.size));
  const href = (p: number) => `/admin/catalog?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <main className="p-4 sm:p-10">
      <p className="eyebrow">Merchandising</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Catalogue</h1>
        <div className="flex gap-2">
          <Link href="/admin/catalog/categories" className="btn btn-outline btn-sm">Categories</Link>
          <Link href="/admin/catalog/new" className="btn btn-primary btn-sm"><PlusIcon /> New product</Link>
        </div>
      </div>

      <form action="/admin/catalog" method="GET" role="search" className="mt-6 flex max-w-xl gap-2">
        <div className="relative flex-1">
          <label htmlFor="cat-q" className="sr-only">Search products</label>
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input id="cat-q" name="q" defaultValue={q} placeholder="Search products…" className="input !pl-11" />
        </div>
        <button type="submit" className="btn btn-primary">Search</button>
        {q && <Link href="/admin/catalog" className="btn btn-ghost">Clear</Link>}
      </form>

      {items.length === 0 ? (
        <div className="card-flat mt-6 grid place-items-center gap-2 px-6 py-16 text-center">
          <p className="font-display text-2xl font-extrabold">No products found.</p>
          <p className="text-ink-soft">{q ? `Nothing matches “${q}”.` : "Create the first product to get started."}</p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {items.map((product) => (
            <li key={product.productId}>
              <Link href={`/admin/catalog/${product.productId}`} className="card group flex flex-wrap items-center gap-x-5 gap-y-2 p-4 no-underline transition hover:shadow-lift sm:p-5">
                <p className="min-w-0 flex-1 basis-48 truncate font-bold text-ink">{product.name}</p>
                <StockBadge status={product.stockStatus} />
                <p className="num text-sm text-ink-soft">from {formatUsd(product.priceFrom)}</p>
                <ChevronRightIcon className="ml-auto text-ink-faint transition group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="num mt-4 text-sm text-ink-faint">{info.total} product{info.total === 1 ? "" : "s"}</p>
      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center gap-3">
          {info.page > 1 ? <Link className="btn btn-outline" href={href(info.page - 1)}><ArrowLeftIcon /> Previous</Link> : <span className="btn btn-outline invisible" aria-hidden="true">Previous</span>}
          <span className="num text-sm font-semibold text-ink-soft">Page {info.page} of {totalPages}</span>
          {info.page < totalPages ? <Link className="btn btn-outline" href={href(info.page + 1)}>Next <ChevronRightIcon /></Link> : <span className="btn btn-outline invisible" aria-hidden="true">Next</span>}
        </nav>
      )}
    </main>
  );
}
