import type { Metadata } from "next";
import Link from "next/link";
import { getCategories } from "@/lib/api-client/catalog";
import { requireToolAccess } from "@/lib/auth/session";
import { ArrowLeftIcon } from "@/components/icons";
import { ProductForm } from "../_components/ProductForm";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireToolAccess("/admin/catalog");
  const categories = await getCategories();
  return (
    <main className="p-4 sm:p-10">
      <Link href="/admin/catalog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft no-underline hover:text-ink"><ArrowLeftIcon /> Catalogue</Link>
      <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">New product</h1>
      <p className="mt-2 max-w-xl text-ink-soft">A product needs at least one category and one variant (a sellable SKU with its own price and stock). Images are added on the next page, once the product exists.</p>
      <div className="mt-6"><ProductForm categories={categories} /></div>
    </main>
  );
}
