"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  clearGuestCart,
  loadGuestCart,
  removeGuestLine,
  toMergePayload,
  updateGuestLineQuantity,
} from "@/lib/cart/guest-cart";
import {
  getCustomerCart,
  mergeCustomerCart,
  removeCustomerCartItem,
  updateCustomerCartItem,
} from "@/lib/cart/customer-cart";
import { CUSTOMER_CART_CHANGED_EVENT, notifyCustomerCartChanged } from "@/lib/cart/events";
import { useGuestCart } from "@/lib/cart/use-guest-cart";
import type { CustomerCart } from "@/lib/cart/types";
import { formatMoney } from "@/lib/cart/use-guest-cart";

export function CartClient({ isCustomer }: { isCustomer: boolean }) {
  const guest = useGuestCart(!isCustomer);
  const [customerCart, setCustomerCart] = useState<CustomerCart | null>(null);
  const [customerLoading, setCustomerLoading] = useState(isCustomer);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const refreshCustomerCart = useCallback(async () => {
    try {
      const cart = await getCustomerCart();
      setCustomerCart(cart);
      setCustomerError(null);
    } catch (error) {
      setCustomerError(error instanceof Error ? error.message : "Could not load your cart.");
    } finally {
      setCustomerLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isCustomer) return;
    void Promise.resolve().then(refreshCustomerCart);
    window.addEventListener(CUSTOMER_CART_CHANGED_EVENT, refreshCustomerCart);
    return () => window.removeEventListener(CUSTOMER_CART_CHANGED_EVENT, refreshCustomerCart);
  }, [isCustomer, refreshCustomerCart]);

  const runCustomerMutation = async (mutate: () => Promise<CustomerCart>) => {
    setPending(true);
    setActionError(null);
    try {
      setCustomerCart(await mutate());
      notifyCustomerCartChanged();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not update your cart.");
    } finally {
      setPending(false);
    }
  };

  const setQuantity = async (line: (typeof guest.pricedLines)[number] | CustomerCart["items"][number], quantity: number) => {
    if (!Number.isInteger(quantity) || quantity > 1000) return;
    if (isCustomer) {
      if (!("cartItemId" in line)) return;
      await runCustomerMutation(() => updateCustomerCartItem(line.cartItemId, quantity));
    } else {
      updateGuestLineQuantity(line.variantId, quantity);
    }
  };

  const removeLine = async (line: (typeof guest.pricedLines)[number] | CustomerCart["items"][number]) => {
    if (isCustomer) {
      if (!("cartItemId" in line)) return;
      await runCustomerMutation(() => removeCustomerCartItem(line.cartItemId));
    } else {
      removeGuestLine(line.variantId);
    }
  };

  const retryGuestMerge = async () => {
    const guestLines = guest.lines;
    const items = toMergePayload(guestLines);
    if (items.length === 0) return;
    setPending(true);
    setActionError(null);
    try {
      setCustomerCart(await mergeCustomerCart(items));
      if (JSON.stringify(loadGuestCart()) === JSON.stringify(guestLines)) {
        clearGuestCart();
        if (loadGuestCart().length > 0) {
          setActionError("Cart synced, but the browser couldn't clear its local copy.");
        }
      } else {
        setActionError("Your cart was synced, but changed guest items remain. Retry to sync them too.");
      }
      notifyCustomerCartChanged();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not merge your guest cart.");
    } finally {
      setPending(false);
    }
  };

  const lines = isCustomer ? customerCart?.items ?? [] : guest.pricedLines;
  const loading = isCustomer ? customerLoading : guest.loading;
  const loadError = isCustomer ? customerError : guest.error;
  const subtotal = isCustomer
    ? customerCart?.subtotal ?? "0.00"
    : formatMoney(guest.subtotal);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-semibold">Your cart</h1>
      {!isCustomer && (
        <p className="mt-2 text-sm text-zinc-500">Your guest cart is saved in this browser.</p>
      )}

      {loadError && (
        <div role="alert" className="mt-5 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          Could not refresh cart details: {loadError}
          {!isCustomer && (
            <button
              type="button"
              className="ml-3 underline"
              onClick={() => window.dispatchEvent(new Event("storage"))}
            >
              Retry
            </button>
          )}
        </div>
      )}
      {actionError && (
        <div role="alert" className="mt-5 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {actionError}
        </div>
      )}
      {isCustomer && guest.lines.length > 0 && (
        <div className="mt-5 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Some items from this browser haven’t synced yet.
          <button
            type="button"
            className="ml-3 underline disabled:opacity-50"
            disabled={pending}
            onClick={() => void retryGuestMerge()}
          >
            Merge guest cart
          </button>
        </div>
      )}

      {loading ? (
        <p className="mt-8" role="status">Loading cart…</p>
      ) : lines.length === 0 ? (
        <div className="mt-8">
          <p className="text-zinc-500">Your cart is empty.</p>
          <Link className="mt-3 inline-block underline" href="/products">Browse products</Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
          {lines.map((line) => (
            <li key={line.variantId} className="flex flex-wrap items-center gap-4 py-5">
              <div className="min-w-48 flex-1">
                <p className="font-medium">{line.productName}</p>
                <p className="text-sm text-zinc-500">Variant {line.variantId}</p>
                <p className="mt-1 text-sm">${line.unitPrice} each</p>
                {"unavailable" in line && line.unavailable && (
                  <p className="mt-1 text-sm font-medium text-red-700">
                    This item is no longer available.
                  </p>
                )}
                {line.stockWarning && (
                  <p className="mt-1 text-sm font-medium text-amber-700">
                    {"productId" in line
                      ? "This variant is currently out of stock."
                      : "Your quantity exceeds the available stock."}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2" aria-label={`Quantity for ${line.productName}`}>
                <button
                  type="button"
                  aria-label={`Decrease quantity for ${line.productName}`}
                  className="h-9 w-9 rounded border disabled:opacity-50"
                  disabled={pending || line.quantity <= 1}
                  onClick={() => void setQuantity(line, line.quantity - 1)}
                >
                  −
                </button>
                <span aria-label="Quantity" className="min-w-8 text-center">{line.quantity}</span>
                <button
                  type="button"
                  aria-label={`Increase quantity for ${line.productName}`}
                  className="h-9 w-9 rounded border disabled:opacity-50"
                  disabled={pending || line.quantity >= 1000 || line.unavailable || line.stockWarning}
                  onClick={() => void setQuantity(line, line.quantity + 1)}
                >
                  +
                </button>
              </div>
              <p className="w-24 text-right font-medium">${line.lineTotal}</p>
              <button
                type="button"
                className="text-sm text-red-700 underline"
                disabled={pending}
                onClick={() => void removeLine(line)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {!loading && (
        <div className="ml-auto mt-6 max-w-sm border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div className="flex justify-between text-lg font-semibold">
            <span>Subtotal</span>
            <span data-testid="cart-subtotal">${subtotal}</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">Prices are refreshed from the current catalog.</p>
        </div>
      )}
    </main>
  );
}
