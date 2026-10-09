import Link from "next/link";
import type { Category } from "@/lib/api-client/catalog";

// A plain Server Component — no "use client", no useState. Filtering by category works by
// navigating to a new URL (?categoryId=3), which Next.js re-renders server-side with the new
// searchParams; there's nothing here that needs to run in the browser. It also means it works with
// JavaScript disabled.
export function CategoryNav({
  categories,
  selectedCategoryId,
  searchQuery,
}: {
  categories: Category[];
  selectedCategoryId?: number;
  // Preserved across category links so switching category doesn't silently drop an active search.
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
      <Link href={hrefFor(undefined)} className="chip no-underline" aria-current={selectedCategoryId === undefined}>
        All
      </Link>
      {categories.map((category) => (
        <Link
          key={category.categoryId}
          href={hrefFor(category.categoryId)}
          className="chip no-underline"
          aria-current={selectedCategoryId === category.categoryId}
        >
          {category.name}
        </Link>
      ))}
    </nav>
  );
}
