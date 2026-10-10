"use client";

import { useActionState } from "react";
import { deactivateVariantAction, updateVariantPriceAction, type CatalogFormState } from "@/app/actions/admin-catalog";
import type { ProductVariant } from "@/lib/api-client/catalog";
import { TrashIcon } from "@/components/icons";
import { StockBadge } from "@/app/(storefront)/_components/StockBadge";
import { FormMessages } from "./FormMessages";

const initial: CatalogFormState = {};

// Price edits apply to FUTURE orders only — order_item keeps the price paid (REQ-10.6, AC-CHECKOUT-6).
// Stock is deliberately not editable here: it belongs to Inventory, where every change is audited.
export function VariantRow({ productId, variant }: { productId: number; variant: ProductVariant }) {
  const [state, action, pending] = useActionState(updateVariantPriceAction, initial);
  return (
    <li className="flex flex-col gap-3 p-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold">{variant.sku}</p>
          <p className="text-xs text-ink-soft">{variant.attributes.map((a) => `${a.name}: ${a.value}`).join(" · ") || "No attributes"}</p>
        </div>
        <StockBadge status={variant.stockStatus} />
      </div>
      <form action={action} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="variantId" value={variant.variantId} />
        <label className="block">
          <span className="label">Price (USD)</span>
          <input name="price" inputMode="decimal" defaultValue={variant.price} className="input num !w-32" />
        </label>
        <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>{pending ? "Saving…" : "Save price"}</button>
        <button type="submit" formAction={deactivateVariantAction} className="btn btn-ghost btn-sm" aria-label={`Deactivate ${variant.sku}`}>
          <TrashIcon /> Deactivate
        </button>
      </form>
      <FormMessages state={state} />
    </li>
  );
}
