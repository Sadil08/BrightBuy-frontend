"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clearGuestCart, loadGuestCart, toMergePayload } from "@/lib/cart/guest-cart";
import { mergeCustomerCart } from "@/lib/cart/customer-cart";
import { notifyCustomerCartChanged } from "@/lib/cart/events";

export function CartMergeSync({ isCustomer }: { isCustomer: boolean }) {
  const inFlight = useRef(false);
  const [retry, setRetry] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const merge = useCallback(async () => {
    if (!isCustomer || inFlight.current) return;
    const guestLines = loadGuestCart();
    const items = toMergePayload(guestLines);
    if (items.length === 0) return;

    inFlight.current = true;
    setMessage("Syncing your guest cart…");
    try {
      await mergeCustomerCart(items);
      if (JSON.stringify(loadGuestCart()) === JSON.stringify(guestLines)) {
        clearGuestCart();
        setMessage(
          loadGuestCart().length === 0
            ? null
            : "Cart synced, but the browser couldn't clear its local copy. Retry to sync it again.",
        );
      } else {
        setMessage("Your cart was synced, but changed guest items remain. Retry to sync them too.");
      }
      notifyCustomerCartChanged();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Could not sync your guest cart: ${error.message}`
          : "Could not sync your guest cart.",
      );
    } finally {
      inFlight.current = false;
    }
  }, [isCustomer]);

  useEffect(() => {
    void Promise.resolve().then(merge);
  }, [merge, retry]);

  if (!message) return null;
  return (
    <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 pb-3 text-sm" role="status">
      <span>{message}</span>
      {message.includes("Retry") && (
        <button type="button" className="underline" onClick={() => setRetry((value) => value + 1)}>
          Retry
        </button>
      )}
    </div>
  );
}
