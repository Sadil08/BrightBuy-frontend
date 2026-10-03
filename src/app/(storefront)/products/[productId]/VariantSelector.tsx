"use client";

import { useState } from "react";
import type { ProductVariant } from "@/lib/api-client/catalog";
import { StockBadge } from "../../_components/StockBadge";

// The ONE client component this whole feature needs. Everything else (list page, category nav,
// search, pagination, even most of THIS page) is a Server Component — this one genuinely needs
// "use client" + useState, because picking a variant has to update the displayed price/stock
// without a full page navigation, and that's interactive, in-browser state.
//
// FR-CATALOG-5 / AC-CATALOG-4, straight from plan.md §7: "a product with a single variant MUST be
// presented without asking the user to choose a variant... no special API field needed." There's no
// `isSingleVariant` flag anywhere in the backend response — this component just checks
// `variants.length === 1` itself, which is the entire implementation of that rule.
export function VariantSelector({ variants }: { variants: ProductVariant[] }) {
  const [selectedId, setSelectedId] = useState(variants[0]?.variantId);
  const selected = variants.find((v) => v.variantId === selectedId) ?? variants[0];

  if (!selected) {
    // plan.md §6: a product with zero variants "should never occur" (every variant requires opening
    // stock at creation), but if the data is ever wrong, fail safe rather than crash the page —
    // same philosophy the backend's toProductSummaryDTO already follows for this exact edge case.
    return <p className="text-zinc-500">Currently unavailable.</p>;
  }

  return (
    <div>
      {/* The actual FR-CATALOG-5 behavior: this whole block, including the picker buttons, only
          renders at all when there's more than one variant to choose between. */}
      {variants.length > 1 && (
        <div role="radiogroup" aria-label="Choose a variant" className="flex flex-wrap gap-2">
          {variants.map((variant) => (
            <button
              key={variant.variantId}
              type="button"
              role="radio"
              aria-checked={variant.variantId === selectedId}
              onClick={() => setSelectedId(variant.variantId)}
              className={`rounded border px-3 py-1.5 text-sm ${
                variant.variantId === selectedId
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {variant.attributes.length > 0
                ? variant.attributes.map((a) => a.value).join(" / ")
                : variant.sku}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <span className="text-xl font-semibold">${selected.price}</span>
        <StockBadge status={selected.stockStatus} />
      </div>
    </div>
  );
}
