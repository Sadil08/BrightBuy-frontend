"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProductVariant } from "@/lib/api-client/catalog";
import { addCustomerCartItem, getCustomerCart } from "@/lib/cart/customer-cart";
import { addGuestLine, loadGuestCart } from "@/lib/cart/guest-cart";
import { notifyCustomerCartChanged } from "@/lib/cart/events";
import { MAX_LINE_QUANTITY } from "@/lib/cart/types";
import { BagIcon, CheckIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { PriceTag } from "../../_components/PriceTag";
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
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; kind: "good" | "bad" } | null>(null);
  const selected = variants.find((v) => v.variantId === selectedId) ?? variants[0];

  if (!selected) {
    // plan.md §6: a product with zero variants "should never occur" (every variant requires opening
    // stock at creation), but if the data is ever wrong, fail safe rather than crash the page —
    // same philosophy the backend's toProductSummaryDTO already follows for this exact edge case.
    return <p className="text-ink-soft">Currently unavailable.</p>;
  }

  const outOfStock = selected.stockStatus === "OUT_OF_STOCK";

  async function addToCart() {
    if (!selected) return;
    setPending(true);
    setMessage(null);
    try {
      if (isCustomer) {
        // The server SETS a line's quantity (it doesn't add to it), so "add 2 more" has to be sent as
        // "existing + 2". Read the current line first.
        const cart = await getCustomerCart();
        const existing = cart.items.find((item) => item.variantId === selected.variantId)?.quantity ?? 0;
        await addCustomerCartItem({
          variantId: selected.variantId,
          quantity: Math.min(existing + quantity, MAX_LINE_QUANTITY),
        });
        notifyCustomerCartChanged();
      } else {
        const existingQuantity =
          loadGuestCart().find((line) => line.variantId === selected.variantId)?.quantity ?? 0;
        addGuestLine({ variantId: selected.variantId, productId, quantity });
        const savedQuantity = loadGuestCart().find((line) => line.variantId === selected.variantId)?.quantity;
        if (savedQuantity !== Math.min(existingQuantity + quantity, MAX_LINE_QUANTITY)) {
          throw new Error("Your browser could not save the guest cart.");
        }
      }
      setMessage({ text: "Added to cart.", kind: "good" });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Could not add this item to your cart.",
        kind: "bad",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* The actual FR-CATALOG-5 behavior: this whole block, including the picker buttons, only
          renders at all when there's more than one variant to choose between. */}
      {variants.length > 1 && (
        <div>
          <p className="label">Choose an option</p>
          <div role="radiogroup" aria-label="Choose a variant" className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.variantId}
                type="button"
                role="radio"
                aria-checked={variant.variantId === selectedId}
                onClick={() => setSelectedId(variant.variantId)}
                className="chip !px-4 !py-2"
              >
                {variant.attributes.length > 0
                  ? variant.attributes.map((a) => a.value).join(" / ")
                  : variant.sku}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <PriceTag value={selected.price} size="lg" />
        <StockBadge status={selected.stockStatus} />
        <span className="font-mono text-xs text-ink-faint">SKU {selected.sku}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center rounded-xl border-[1.5px] border-line-strong bg-surface" role="group" aria-label="Quantity">
          <button
            type="button"
            aria-label="Decrease quantity"
            className="btn btn-ghost !rounded-r-none !px-3"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <MinusIcon />
          </button>
          <span className="num w-10 text-center font-bold" aria-live="polite">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            className="btn btn-ghost !rounded-l-none !px-3"
            disabled={quantity >= MAX_LINE_QUANTITY}
            onClick={() => setQuantity((q) => Math.min(MAX_LINE_QUANTITY, q + 1))}
          >
            <PlusIcon />
          </button>
        </div>
        <button
          type="button"
          disabled={pending || outOfStock}
          onClick={() => void addToCart()}
          className="btn btn-primary btn-lg flex-1 sm:flex-none sm:min-w-52"
        >
          <BagIcon /> {pending ? "Adding…" : outOfStock ? "Out of stock" : "Add to cart"}
        </button>
      </div>

      {message && (
        <p role="status" className={`alert ${message.kind === "good" ? "alert-good" : "alert-bad"} items-center`}>
          {message.kind === "good" && <CheckIcon />}
          <span>{message.text}</span>
          {message.kind === "good" && (
            <Link href="/cart" className="ml-auto font-bold underline">
              View cart
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
