import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { getProduct } from "@/lib/api-client/catalog";
import { deactivateProductAction } from "@/app/actions/admin-catalog";
import { requireToolAccess } from "@/lib/auth/session";
import { ArrowLeftIcon, TrashIcon } from "@/components/icons";
import { AddVariantForm } from "../_components/AddVariantForm";
import { EditProductForm } from "../_components/EditProductForm";
import { ImageManager } from "../_components/ImageManager";
import { VariantRow } from "../_components/VariantRow";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  await requireToolAccess("/admin/catalog");
  const id = Number((await params).productId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  let product;
  try {
    product = await getProduct(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <main className="p-4 sm:p-10">
      <Link href="/admin/catalog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft no-underline hover:text-ink"><ArrowLeftIcon /> Catalogue</Link>
      <p className="eyebrow mt-4">Product #{product.productId}</p>
      <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{product.name}</h1>
      <p className="mt-1 text-sm text-ink-soft">{product.categories.map((c) => c.name).join(", ") || "No categories"}</p>

      <div className="mt-6 grid max-w-4xl gap-6">
        <section className="card p-4 sm:p-6" aria-labelledby="details-h">
          <h2 id="details-h" className="mb-4 text-xl font-extrabold">Details</h2>
          <EditProductForm productId={product.productId} name={product.name} description={product.description} />
        </section>

        <section className="card overflow-hidden" aria-labelledby="variants-h">
          <h2 id="variants-h" className="border-b border-line p-4 text-xl font-extrabold sm:px-5">Variants</h2>
          <ul className="divide-y divide-line">
            {product.variants.map((variant) => <VariantRow key={variant.variantId} productId={product.productId} variant={variant} />)}
          </ul>
          <details className="border-t border-line p-4 sm:px-5">
            <summary className="cursor-pointer text-sm font-bold text-action">Add a variant</summary>
            <div className="mt-4"><AddVariantForm productId={product.productId} /></div>
          </details>
        </section>

        <section className="card p-4 sm:p-6" aria-labelledby="images-h">
          <h2 id="images-h" className="mb-4 text-xl font-extrabold">Images</h2>
          <ImageManager productId={product.productId} images={product.images ?? []} />
        </section>

        <section className="card-flat flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5" aria-labelledby="danger-h">
          <div>
            <h2 id="danger-h" className="text-lg font-extrabold">Deactivate product</h2>
            <p className="text-sm text-ink-soft">Hides it from shoppers. Past orders keep their details; nothing is deleted.</p>
          </div>
          <form action={deactivateProductAction}>
            <input type="hidden" name="productId" value={product.productId} />
            <button type="submit" className="btn btn-danger btn-sm"><TrashIcon /> Deactivate</button>
          </form>
        </section>
      </div>
    </main>
  );
}
