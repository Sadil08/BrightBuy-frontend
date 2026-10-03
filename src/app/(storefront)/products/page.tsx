import Link from "next/link";
import { getCategories, getProducts } from "@/lib/api-client/catalog";
import { CategoryNav } from "../_components/CategoryNav";
import { StockBadge } from "../_components/StockBadge";

// Server Component, no "use client" anywhere on this page: search, category filtering, and
// pagination are all plain navigation (a GET <form>, and <Link>s that change the query string) —
// Next.js re-runs this component on the server for every new URL, reads the new searchParams, and
// fetches fresh data. No client-side state, no useEffect, no loading spinner logic to get wrong.
//
// `searchParams` arrives as a Promise (not a plain object) in this Next.js version — see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md, "searchParams
// (optional)" — so it must be awaited before use, same as a regular async data fetch.
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoryId?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const categoryId = params.categoryId ? Number(params.categoryId) : undefined;
  const page = params.page ? Number(params.page) : undefined;

  // Fetched together (Promise.all), not one after another — categories and the product page don't
  // depend on each other, so there's no reason to make a visitor wait for both round trips in
  // sequence when they can happen at the same time.
  const [categories, productList] = await Promise.all([
    getCategories(),
    getProducts({ q: q || undefined, categoryId, page }),
  ]);

  const { items, page: pageInfo } = productList;
  const totalPages = Math.max(1, Math.ceil(pageInfo.total / pageInfo.size));

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-semibold">Products</h1>

      {/* A plain HTML GET form — submitting it navigates to /products?q=... directly, no JS
          required at all. The hidden categoryId field preserves the active category filter, since
          submitting a form replaces the ENTIRE query string with just this form's own fields
          otherwise, silently dropping any filter that isn't one of its inputs. */}
      <form action="/products" method="GET" className="mt-6 flex gap-2">
        {categoryId !== undefined && <input type="hidden" name="categoryId" value={categoryId} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search products..."
          className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Search
        </button>
      </form>

      <div className="mt-6">
        <CategoryNav
          categories={categories}
          selectedCategoryId={categoryId}
          searchQuery={q || undefined}
        />
      </div>

      {/* AC-CATALOG-1's "empty results are a 200 with an empty list, not an error" rule, mirrored
          on the frontend: a search/filter with no matches renders a plain message, not an error
          page — there was never anything wrong with the request. */}
      {items.length === 0 ? (
        <p className="mt-10 text-zinc-500">No products match your search.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((product) => (
            <li key={product.productId}>
              <Link
                href={`/products/${product.productId}`}
                className="block rounded border border-zinc-200 p-4 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                <p className="font-medium">{product.name}</p>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">${product.priceFrom}</p>
                <div className="mt-2">
                  <StockBadge status={product.stockStatus} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex items-center gap-3">
          {pageInfo.page > 1 && (
            <PageLink q={q} categoryId={categoryId} page={pageInfo.page - 1} label="← Previous" />
          )}
          <span className="text-sm text-zinc-500">
            Page {pageInfo.page} of {totalPages}
          </span>
          {pageInfo.page < totalPages && (
            <PageLink q={q} categoryId={categoryId} page={pageInfo.page + 1} label="Next →" />
          )}
        </nav>
      )}
    </main>
  );
}

// A small helper, local to this file: builds a pagination link that preserves whatever search/
// category filter is currently active, only changing the `page` value — the same "build a
// URLSearchParams, only set what's actually present" pattern as the API client and CategoryNav.
function PageLink({
  q,
  categoryId,
  page,
  label,
}: {
  q: string;
  categoryId: number | undefined;
  page: number;
  label: string;
}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (categoryId !== undefined) params.set("categoryId", String(categoryId));
  params.set("page", String(page));

  return (
    <Link
      href={`/products?${params.toString()}`}
      className="rounded border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
    >
      {label}
    </Link>
  );
}
