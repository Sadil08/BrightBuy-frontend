import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { getProduct } from "@/lib/api-client/catalog";
import { VariantSelector } from "./VariantSelector";

// `params` is also a Promise here, same reasoning as `searchParams` on the list page — this
// version's docs are explicit this applies to dynamic segments too
// (file-conventions/page.md, "params (optional)").
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const id = Number(productId);

  // A non-numeric segment (e.g. /products/banana) is caught here, on the frontend, before even
  // trying the backend — the backend would also reject it (400 INVALID_ID), but there's no reason
  // to make a network round trip just to learn "this was never a valid product page."
  // `notFound()` renders Next.js's not-found UI and sets a real 404 status — same outcome plan.md
  // §6 specifies ("gone means gone," no distinction between bad input and a missing product).
  if (!Number.isInteger(id)) {
    notFound();
  }

  let product;
  try {
    product = await getProduct(id);
  } catch (err) {
    // ApiError.status comes straight from the backend's real HTTP response (src/lib/api-client's
    // apiFetch) — a 404 here means the backend's own GetProduct handler returned
    // PRODUCT_NOT_FOUND (a deactivated or nonexistent product, indistinguishable on purpose,
    // AC-CATALOG-6). Anything else (a 500, a network failure) is a genuine unexpected error and
    // should surface as one — re-thrown, not silently treated as "not found."
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href="/products" className="text-sm text-zinc-500 hover:underline">
        ← Back to products
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">{product.name}</h1>

      {product.categories.length > 0 && (
        <p className="mt-1 text-sm text-zinc-500">
          {product.categories.map((category) => category.name).join(", ")}
        </p>
      )}

      <p className="mt-4 text-zinc-700 dark:text-zinc-300">{product.description}</p>

      <div className="mt-6">
        <VariantSelector variants={product.variants} />
      </div>
    </main>
  );
}
