import type { StockStatus } from "@/lib/api-client/catalog";
import { CheckIcon } from "@/components/icons";

// Renders only the two-value enum the backend ever sends (SEC-CATALOG-1 / FR-CATALOG-7) — there is
// no numeric quantity anywhere in this component because there is none anywhere upstream of it
// either; the type system (StockStatus is a union of exactly two string literals) makes a third
// value a compile error, not just a runtime assumption.
export function StockBadge({ status }: { status: StockStatus }) {
  const inStock = status === "IN_STOCK";
  return (
    <span className={`badge ${inStock ? "badge-good" : "badge-neutral"}`}>
      {inStock && <CheckIcon width="0.95em" height="0.95em" strokeWidth={2.4} />}
      {inStock ? "In stock" : "Out of stock"}
    </span>
  );
}
