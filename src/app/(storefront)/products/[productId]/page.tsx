import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { getProduct } from "@/lib/api-client/catalog";
import { getSession } from "@/lib/auth/session";
import { ProductArt } from "@/components/ProductArt";
import { ArrowLeftIcon, ShieldIcon, StoreIcon, TruckIcon } from "@/components/icons";
import { VariantSelector } from "./VariantSelector";

type Params = { params: Promise<{ productId: string }> };

// Fetch once per request for both the page and its <title>: React's fetch de-duplication means the
// second call below is free.
async function loadProduct(productId: string) {
  const id = Number(productId);
  // A non-numeric segment (e.g. /products/banana) is caught here, on the frontend, before even
  // trying the backend. `notFound()` renders the not-found UI and sets a real 404 status.
  if (!Number.isInteger(id)) notFound();
  try {
    return await getProduct(id);
  } catch (err) {
    // A 404 from the backend means a deactivated or nonexistent product, indistinguishable on
    // purpose (AC-CATALOG-6). Anything else is a genuine unexpected error and surfaces as one.
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const product = await loadProduct((await params).productId);
  return { title: product.name, description: product.description.slice(0, 160) };
}

// `params` is a Promise in this Next.js version (file-conventions/page.md, "params (optional)").
export default async function ProductDetailPage({ params }: Params) {
  const product = await loadProduct((await params).productId);
  const user = await getSession();

  return (
    <main className="container-page py-8">
      <Link href="/products" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft no-underline hover:text-ink">
        <ArrowLeftIcon /> All products
      </Link>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
        <div className="card overflow-hidden self-start">
          <ProductArt seed={product.productId} label={product.name} className="aspect-[4/3] w-full" />
        </div>

        <div className="flex flex-col gap-6">
          <div>
            {product.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.categories.map((category) => (
                  <Link key={category.categoryId} href={`/products?categoryId=${category.categoryId}`} className="badge badge-neutral no-underline hover:bg-line">
                    {category.name}
                  </Link>
                ))}
              </div>
            )}
            <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">{product.name}</h1>
            <p className="mt-4 max-w-prose text-ink-soft">{product.description}</p>
          </div>

          <VariantSelector
            productId={product.productId}
            variants={product.variants}
            isCustomer={user?.role === "CUSTOMER"}
          />

          <ul className="card-flat divide-y divide-line text-sm">
            <li className="flex items-center gap-3 p-4">
              <StoreIcon className="text-action" /> <span><strong>Store pickup</strong> is ready the same day when it&apos;s in stock.</span>
            </li>
            <li className="flex items-center gap-3 p-4">
              <TruckIcon className="text-action" /> <span><strong>Delivery</strong> in 5–7 days. You&apos;ll see your date before you pay.</span>
            </li>
            <li className="flex items-center gap-3 p-4">
              <ShieldIcon className="text-action" /> <span>Prices are final: tax and delivery are shown at checkout.</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
