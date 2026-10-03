import Link from "next/link";
import type { Category } from "@/lib/api-client/catalog";

// A plain Server Component — no "use client", no useState. Filtering by category works by
// navigating to a new URL (?categoryId=3), which Next.js re-renders server-side with the new
// searchParams; there's nothing here that needs to run in the browser. This is deliberately NOT
// built with onClick handlers + client-side state (FR-CATALOG-4 doesn't ask for that), which also
// means it works with JavaScript disabled and needs no test for client-side interaction logic that
// doesn't exist.
export function CategoryNav({
  categories,
  selectedCategoryId,
  searchQuery,
}: {
  categories: Category[];
  selectedCategoryId?: number;
  // Preserved across category links so switching category doesn't silently drop an active search —
  // e.g. "bluetooth" + Audio category should stay "bluetooth" + Electronics when the user clicks a
  // different category pill.
  searchQuery?: string;
}) {
  const hrefFor = (categoryId?: number) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (categoryId !== undefined) params.set("categoryId", String(categoryId));
    const query = params.toString();
    return `/products${query ? `?${query}` : ""}`;
  };

  return (
    <nav aria-label="Categories" className="flex flex-wrap gap-2">
      <Link
        href={hrefFor(undefined)}
        className={`rounded-full px-3 py-1 text-sm ${
          selectedCategoryId === undefined
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
        }`}
      >
        All categories
      </Link>
      {categories.map((category) => (
        <Link
          key={category.categoryId}
          href={hrefFor(category.categoryId)}
          className={`rounded-full px-3 py-1 text-sm ${
            selectedCategoryId === category.categoryId
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          {category.name}
        </Link>
      ))}
    </nav>
  );
}
