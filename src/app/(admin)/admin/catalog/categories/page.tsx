import type { Metadata } from "next";
import Link from "next/link";
import { getCategories } from "@/lib/api-client/catalog";
import { requireToolAccess } from "@/lib/auth/session";
import { ArrowLeftIcon } from "@/components/icons";
import { CategoryRow, NewCategoryForm } from "../_components/CategoryForms";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireToolAccess("/admin/catalog");
  const categories = await getCategories();
  return (
    <main className="p-4 sm:p-10">
      <Link href="/admin/catalog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft no-underline hover:text-ink"><ArrowLeftIcon /> Catalogue</Link>
      <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Categories</h1>
      <p className="mt-2 max-w-xl text-ink-soft">Deactivating a category hides it from the storefront filters; products keep their other categories.</p>
      <div className="mt-6 grid max-w-3xl gap-6">
        <NewCategoryForm />
        <section className="card overflow-hidden" aria-label="Existing categories">
          {categories.length === 0 ? <p className="p-6 text-ink-soft">No categories yet.</p> : (
            <ul className="divide-y divide-line">{categories.map((c) => <CategoryRow key={c.categoryId} category={c} />)}</ul>
          )}
        </section>
      </div>
    </main>
  );
}
