import type { StockStatus } from "@/lib/api-client/catalog";

// Renders only the two-value enum the backend ever sends (SEC-CATALOG-1 / FR-CATALOG-7) — there is
// no numeric quantity anywhere in this component because there is none anywhere upstream of it
// either; the type system (StockStatus is a union of exactly two string literals) makes a third
// value a compile error, not just a runtime assumption.
export function StockBadge({ status }: { status: StockStatus }) {
  const inStock = status === "IN_STOCK";
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
        inStock
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
      }`}
    >
      {inStock ? "In Stock" : "Out of Stock"}
    </span>
  );
}
