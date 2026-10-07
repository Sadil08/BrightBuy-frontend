"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCustomerCart } from "@/lib/cart/customer-cart";
import { CUSTOMER_CART_CHANGED_EVENT } from "@/lib/cart/events";
import { GUEST_CART_CHANGED_EVENT, loadGuestCart } from "@/lib/cart/guest-cart";

export function CartNavLink({ isCustomer }: { isCustomer: boolean }) {
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      if (!isCustomer) {
        setCount(loadGuestCart().reduce((total, line) => total + line.quantity, 0));
        setError(false);
        return;
      }
      try {
        const cart = await getCustomerCart();
        if (!cancelled) {
          setCount(cart.items.reduce((total, line) => total + line.quantity, 0));
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setCount(null);
          setError(true);
        }
      }
    };
    void refresh();
    window.addEventListener(GUEST_CART_CHANGED_EVENT, refresh);
    window.addEventListener(CUSTOMER_CART_CHANGED_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(GUEST_CART_CHANGED_EVENT, refresh);
      window.removeEventListener(CUSTOMER_CART_CHANGED_EVENT, refresh);
    };
  }, [isCustomer]);

  return (
    <Link
      href="/cart"
      className="text-sm text-zinc-600 dark:text-zinc-400"
      aria-label={error ? "Cart count unavailable" : `Cart${count === null ? "" : `, ${count} items`}`}
    >
      Cart{error ? " (unavailable)" : count === null ? "" : ` (${count})`}
    </Link>
  );
}
