"use client";

import { useState } from "react";
import type { ProductVariant } from "@/lib/api-client/catalog";
import { addCustomerCartItem } from "@/lib/cart/customer-cart";
import { addGuestLine, loadGuestCart } from "@/lib/cart/guest-cart";
import { notifyCustomerCartChanged } from "@/lib/cart/events";
import { MAX_LINE_QUANTITY } from "@/lib/cart/types";
import { StockBadge } from "../../_components/StockBadge";

// Product detail keeps its catalog reads server-side; this client component handles variant
// selection and adding the chosen variant without a full page navigation.
//
// FR-CATALOG-5 / AC-CATALOG-4, straight from plan.md §7: "a product with a single variant MUST be
// presented without asking the user to choose a variant... no special API field needed." There's no
// `isSingleVariant` flag anywhere in the backend response — this component just checks
// `variants.length === 1` itself, which is the entire implementation of that rule.
export function VariantSelector({
  productId,
  variants,
  isCustomer,
}: {
  productId: number;
  variants: ProductVariant[];
  isCustomer: boolean;
}) {
  const [selectedId, setSelectedId] = useState(variants[0]?.variantId);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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
      <button
        type="button"
        disabled={pending || selected.stockStatus === "OUT_OF_STOCK"}
        onClick={async () => {
          setPending(true);
          setMessage(null);
          try {
            if (isCustomer) {
              await addCustomerCartItem({ variantId: selected.variantId, quantity: 1 });
              notifyCustomerCartChanged();
            } else {
              const existingQuantity =
                loadGuestCart().find((line) => line.variantId === selected.variantId)?.quantity ?? 0;
              addGuestLine({ variantId: selected.variantId, productId, quantity: 1 });
              const savedQuantity =
                loadGuestCart().find((line) => line.variantId === selected.variantId)?.quantity;
              if (savedQuantity !== Math.min(existingQuantity + 1, MAX_LINE_QUANTITY)) {
                throw new Error("Your browser could not save the guest cart.");
              }
            }
            setMessage("Added to cart.");
          } catch (error) {
            setMessage(error instanceof Error ? error.message : "Could not add this item to your cart.");
          } finally {
            setPending(false);
          }
        }}
        className="mt-5 rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Adding…" : "Add to cart"}
      </button>
      {message && (
        <p role="status" className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {message}
        </p>
      )}
    </div>
  );
}
