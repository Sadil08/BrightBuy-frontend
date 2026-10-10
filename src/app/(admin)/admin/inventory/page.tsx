import type { Metadata } from "next";
import Link from "next/link";
import { ApiError } from "@/lib/api-client";
import { searchVariants } from "@/lib/api-client/inventory";
import { cookieHeaderFromRequest, requireInventoryAccess } from "@/lib/auth/session";
import { SearchIcon, ArrowLeftIcon, ChevronRightIcon } from "@/components/icons";
import { AdjustStockForm } from "./AdjustStockForm";

export const metadata: Metadata = { title: "Inventory" };

const LOW_STOCK = 5;
const PAGE_SIZE = 20;

// Staff see the EXACT quantity here (FR-INVENTORY-1, SEC-INVENTORY-2); the public catalog only ever
// shows In stock / Out of stock. The role check below is coarse; the backend enforces the
// `stock:adjust` permission on both endpoints.
export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requireInventoryAccess();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const page = Math.max(1, Number(params.page) || 1);

  let result;
  try {
    result = await searchVariants(await cookieHeaderFromRequest(), { q: q || undefined, page, size: PAGE_SIZE });
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return (
        <main className="p-4 sm:p-10">
          <h1 className="text-3xl font-extrabold sm:text-4xl">Inventory</h1>
          <p className="alert alert-bad mt-6 max-w-xl">Your role doesn&apos;t have permission to manage stock. Ask an administrator to grant stock:adjust.</p>
        </main>
      );
    }
    throw error;
  }

  const { items, page: info } = result;
  const totalPages = Math.max(1, Math.ceil(info.total / info.size));
  const pageHref = (p: number) => `/admin/inventory?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) }).toString()}`;

  return (
    <main className="p-4 sm:p-10">
      <p className="eyebrow">Warehouse</p>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Inventory</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Search by SKU or product name. Every change is logged with who made it and why.
      </p>

      <form action="/admin/inventory" method="GET" role="search" className="mt-6 flex max-w-xl gap-2">
        <div className="relative flex-1">
          <label htmlFor="inv-q" className="sr-only">Search by SKU or product name</label>
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input id="inv-q" name="q" defaultValue={q} placeholder="SKU or product name…" className="input !pl-11" />
        </div>
        <button type="submit" className="btn btn-primary">Search</button>
        {q && <Link href="/admin/inventory" className="btn btn-ghost">Clear</Link>}
      </form>

      <section className="card mt-6 overflow-hidden" aria-label="Variants">
        {items.length === 0 ? (
          <div className="grid place-items-center gap-2 px-6 py-16 text-center">
            <p className="font-display text-2xl font-extrabold">No variants found.</p>
            <p className="text-ink-soft">{q ? `Nothing matches “${q}”. Check the SKU spelling.` : "There are no variants yet."}</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((variant) => (
              <li key={variant.variantId} className="p-4 sm:px-5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-1 basis-44">
                    <p className="font-semibold">{variant.productName}</p>
                    <p className="font-mono text-xs text-ink-soft">{variant.sku}</p>
                  </div>
                  <span className="inline-flex items-center gap-2">
                    {variant.stockQuantity === 0 ? <span className="badge badge-bad">Out</span> : variant.stockQuantity <= LOW_STOCK ? <span className="badge badge-warn">Low</span> : null}
                    <span className="num font-display text-lg font-extrabold" aria-label={`${variant.stockQuantity} in stock`}>{variant.stockQuantity}</span>
                  </span>
                </div>
                {/* Opens in the flow of the list (not an absolutely-positioned popover), so it can't be
                    clipped by the card or fall off a narrow screen. */}
                <details className="group mt-3">
                  <summary className="btn btn-outline btn-sm marker:hidden [&::-webkit-details-marker]:hidden list-none">Adjust stock</summary>
                  <div className="mt-3 max-w-md rounded-xl bg-surface-2 p-4">
                    <AdjustStockForm variantId={variant.variantId} sku={variant.sku} current={variant.stockQuantity} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
        <p className="num border-t border-line px-4 py-3 text-sm text-ink-faint">
          {info.total} variant{info.total === 1 ? "" : "s"}{q ? ` matching “${q}”` : ""}
        </p>
      </section>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex items-center gap-3">
          {info.page > 1 ? <Link className="btn btn-outline" href={pageHref(info.page - 1)}><ArrowLeftIcon /> Previous</Link> : <span className="btn btn-outline invisible" aria-hidden="true">Previous</span>}
          <span className="num text-sm font-semibold text-ink-soft">Page {info.page} of {totalPages}</span>
          {info.page < totalPages ? <Link className="btn btn-outline" href={pageHref(info.page + 1)}>Next <ChevronRightIcon /></Link> : <span className="btn btn-outline invisible" aria-hidden="true">Next</span>}
        </nav>
      )}
    </main>
  );
}
