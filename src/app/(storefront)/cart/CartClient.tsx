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
import type { City } from "@/lib/api-client/delivery";
import { formatUsd, moneyToCents } from "@/lib/money";
import { ProductArt } from "@/components/ProductArt";
import { AlertIcon, ArrowLeftIcon, BagIcon, LockIcon, MinusIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { DeliveryEstimate, type DeliveryChoice } from "../_components/DeliveryEstimate";

export function CartClient({ isCustomer, cities = [] }: { isCustomer: boolean; cities?: City[] }) {
  const guest = useGuestCart(!isCustomer);
  const [customerCart, setCustomerCart] = useState<CustomerCart | null>(null);
  const [customerLoading, setCustomerLoading] = useState(isCustomer);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryChoice>({ mode: "StorePickup" });

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
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);
  const hasProblem = lines.some((line) => ("unavailable" in line && line.unavailable) || line.stockWarning);
  const estimateItems = lines
    .filter((line) => !("unavailable" in line && line.unavailable))
    .map((line) => ({ variantId: line.variantId, quantity: line.quantity }));

  return (
    <main className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Your bag</p>
          <h1 className="mt-2 text-4xl font-extrabold">Your cart</h1>
        </div>
        {!isCustomer && (
          <p className="text-sm text-ink-faint">Your guest cart is saved in this browser.</p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {loadError && (
          <div role="alert" className="alert alert-bad items-center">
            <AlertIcon />
            <span>Could not refresh cart details: {loadError}</span>
            {!isCustomer && (
              <button type="button" className="btn btn-sm btn-outline ml-auto" onClick={() => window.dispatchEvent(new Event("storage"))}>
                Retry
              </button>
            )}
          </div>
        )}
        {actionError && (
          <div role="alert" className="alert alert-bad items-center">
            <AlertIcon />
            <span>{actionError}</span>
          </div>
        )}
        {isCustomer && guest.lines.length > 0 && (
          <div className="alert alert-warn items-center">
            <span>Some items from this browser haven’t synced yet.</span>
            <button type="button" className="btn btn-sm btn-outline ml-auto" disabled={pending} onClick={() => void retryGuestMerge()}>
              Merge guest cart
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]" role="status" aria-label="Loading cart">
          <div className="space-y-4">
            {[0, 1].map((i) => <div key={i} className="skeleton h-32 w-full" />)}
          </div>
          <div className="skeleton h-72 w-full" />
        </div>
      ) : lines.length === 0 ? (
        <div className="card-flat mt-8 grid place-items-center gap-3 px-6 py-20 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-action-soft text-action"><BagIcon className="h-8 w-8" /></span>
          <p className="font-display text-2xl font-extrabold">Your cart is empty.</p>
          <p className="max-w-sm text-ink-soft">Add something you like and it will wait for you here.</p>
          <Link className="btn btn-primary btn-lg mt-2" href="/products">Browse products</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <ul className="flex flex-col gap-3">
            {lines.map((line) => {
              const unavailable = "unavailable" in line && line.unavailable;
              return (
                <li key={line.variantId} className="card flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28">
                    <ProductArt seed={"productId" in line ? line.productId : line.variantId} label={line.productName} className="h-full w-full" letters={false} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold leading-snug">
                      {"productId" in line && !unavailable ? (
                        <Link href={`/products/${line.productId}`} className="text-ink no-underline hover:underline">{line.productName}</Link>
                      ) : (
                        line.productName
                      )}
                    </p>
                    <p className="num mt-0.5 text-sm text-ink-soft">{formatUsd(line.unitPrice)} each</p>
                    {unavailable && (
                      <p className="badge badge-bad mt-2">This item is no longer available.</p>
                    )}
                    {line.stockWarning && !unavailable && (
                      <p className="badge badge-warn mt-2">
                        {"productId" in line
                          ? "This variant is currently out of stock."
                          : "Your quantity exceeds the available stock."}
                      </p>
                    )}
                  </div>
                  <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:w-auto sm:flex-col sm:items-end">
                    <div className="inline-flex items-center rounded-xl border-[1.5px] border-line-strong bg-surface" aria-label={`Quantity for ${line.productName}`}>
                      <button
                        type="button"
                        aria-label={`Decrease quantity for ${line.productName}`}
                        className="btn btn-ghost !rounded-r-none !px-2.5 !py-2"
                        disabled={pending || line.quantity <= 1}
                        onClick={() => void setQuantity(line, line.quantity - 1)}
                      >
                        <MinusIcon />
                      </button>
                      <span aria-label="Quantity" className="num min-w-9 text-center font-bold">{line.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase quantity for ${line.productName}`}
                        className="btn btn-ghost !rounded-l-none !px-2.5 !py-2"
                        disabled={pending || line.quantity >= 1000 || unavailable || line.stockWarning}
                        onClick={() => void setQuantity(line, line.quantity + 1)}
                      >
                        <PlusIcon />
                      </button>
                    </div>
                    <p className="num font-display text-xl font-extrabold">{unavailable ? "—" : formatUsd(line.lineTotal)}</p>
                    <button type="button" className="btn btn-ghost btn-sm !text-bad" disabled={pending} onClick={() => void removeLine(line)}>
                      <TrashIcon /> Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="card flex flex-col gap-5 p-5 lg:sticky lg:top-24" aria-label="Order summary">
            <h2 className="text-xl font-extrabold">Summary</h2>
            <DeliveryEstimate cities={cities} items={estimateItems} value={delivery} onChange={setDelivery} />
            <div className="h-px bg-line" />
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Items ({itemCount})</dt>
                <dd className="num font-semibold" data-testid="cart-subtotal">{formatUsd(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-soft">
                <dt>Tax and delivery fee</dt>
                <dd>Added at checkout</dd>
              </div>
            </dl>
            <div className="flex items-baseline justify-between border-t border-line pt-4">
              <span className="font-bold">Subtotal</span>
              <span className="num font-display text-3xl font-extrabold">{formatUsd(subtotal)}</span>
            </div>
            {hasProblem && (
              <p className="alert alert-warn text-sm">Fix the highlighted items before you check out.</p>
            )}
            {isCustomer ? (
              <Link
                href="/checkout"
                aria-disabled={hasProblem || moneyToCents(subtotal) === 0}
                className={`btn btn-primary btn-lg ${hasProblem ? "pointer-events-none opacity-50" : ""}`}
              >
                <LockIcon /> Checkout
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login?next=/checkout" className="btn btn-primary btn-lg">
                  <LockIcon /> Log in to check out
                </Link>
                <p className="text-center text-xs text-ink-faint">
                  New here? <Link href="/register?next=/checkout" className="font-bold">Create an account</Link>. Your cart comes with you.
                </p>
              </div>
            )}
            <Link href="/products" className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-ink-soft no-underline hover:text-ink">
              <ArrowLeftIcon /> Keep shopping
            </Link>
            <p className="text-center text-xs text-ink-faint">Prices are refreshed from the current catalog.</p>
          </aside>
        </div>
      )}
    </main>
  );
}
