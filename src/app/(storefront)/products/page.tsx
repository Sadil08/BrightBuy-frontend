import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getProducts } from "@/lib/api-client/catalog";
import { SearchIcon, ArrowLeftIcon, ChevronRightIcon } from "@/components/icons";
import { CategoryNav } from "../_components/CategoryNav";
import { ProductCard } from "../_components/ProductCard";

export const metadata: Metadata = { title: "Shop" };

// Server Component, no "use client" anywhere on this page: search, category filtering, and
// pagination are all plain navigation (a GET <form>, and <Link>s that change the query string) —
// Next.js re-runs this component on the server for every new URL, reads the new searchParams, and
// fetches fresh data. No client-side state, no useEffect, no loading spinner logic to get wrong.
//
// `searchParams` arrives as a Promise (not a plain object) in this Next.js version — see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md.
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoryId?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const categoryId = params.categoryId ? Number(params.categoryId) : undefined;
  const page = params.page ? Number(params.page) : undefined;

  // Fetched together (Promise.all): categories and the product page don't depend on each other.
  const [categories, productList] = await Promise.all([
    getCategories(),
    getProducts({ q: q || undefined, categoryId, page }),
  ]);

  const { items, page: pageInfo } = productList;
  const totalPages = Math.max(1, Math.ceil(pageInfo.total / pageInfo.size));
  const activeCategory = categories.find((c) => c.categoryId === categoryId);

  return (
    <main className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{activeCategory ? "Category" : "The shop"}</p>
          <h1 className="mt-2 text-4xl font-extrabold">{activeCategory?.name ?? (q ? `Results for “${q}”` : "All products")}</h1>
          {activeCategory?.description && <p className="mt-2 max-w-xl text-ink-soft">{activeCategory.description}</p>}
        </div>
        <p className="num text-sm text-ink-faint">
          {pageInfo.total} {pageInfo.total === 1 ? "product" : "products"}
        </p>
      </div>

      {/* A plain HTML GET form — submitting it navigates to /products?q=... directly, no JS required.
          The hidden categoryId field preserves the active category filter, since submitting a form
          replaces the ENTIRE query string with just this form's own fields otherwise. */}
      <form action="/products" method="GET" role="search" className="mt-6 flex gap-2">
        {categoryId !== undefined && <input type="hidden" name="categoryId" value={categoryId} />}
        <div className="relative flex-1">
          <label htmlFor="q" className="sr-only">Search products</label>
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input id="q" type="search" name="q" defaultValue={q} placeholder="Search products…" className="input !pl-11" />
        </div>
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      <div className="mt-5">
        <CategoryNav categories={categories} selectedCategoryId={categoryId} searchQuery={q || undefined} />
      </div>

      {/* AC-CATALOG-1's "empty results are a 200 with an empty list, not an error" rule, mirrored on
          the frontend: a search/filter with no matches renders a message, not an error page. */}
      {items.length === 0 ? (
        <div className="card-flat mt-10 grid place-items-center gap-3 px-6 py-16 text-center">
          <p className="font-display text-2xl font-extrabold">Nothing matches that.</p>
          <p className="max-w-sm text-ink-soft">Try a shorter search, or clear the category to see everything.</p>
          <Link href="/products" className="btn btn-outline mt-2">Clear filters</Link>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => (
            <li key={product.productId}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-3">
          {pageInfo.page > 1 ? (
            <PageLink q={q} categoryId={categoryId} page={pageInfo.page - 1} label="Previous" dir="prev" />
          ) : (
            <span aria-hidden="true" className="btn btn-outline invisible">Previous</span>
          )}
          <span className="num text-sm font-semibold text-ink-soft">
            Page {pageInfo.page} of {totalPages}
          </span>
          {pageInfo.page < totalPages ? (
            <PageLink q={q} categoryId={categoryId} page={pageInfo.page + 1} label="Next" dir="next" />
          ) : (
            <span aria-hidden="true" className="btn btn-outline invisible">Next</span>
          )}
        </nav>
      )}
    </main>
  );
}

// Builds a pagination link that preserves whatever search/category filter is currently active,
// only changing the `page` value.
function PageLink({
  q,
  categoryId,
  page,
  label,
  dir,
}: {
  q: string;
  categoryId: number | undefined;
  page: number;
  label: string;
  dir: "prev" | "next";
}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (categoryId !== undefined) params.set("categoryId", String(categoryId));
  params.set("page", String(page));

  return (
    <Link href={`/products?${params.toString()}`} className="btn btn-outline">
      {dir === "prev" && <ArrowLeftIcon />}
      {label}
      {dir === "next" && <ChevronRightIcon />}
    </Link>
  );
}
