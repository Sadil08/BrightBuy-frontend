"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BagIcon } from "@/components/icons";
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
      className="btn btn-outline relative !px-3.5"
      aria-label={error ? "Cart count unavailable" : `Cart${count === null ? "" : `, ${count} items`}`}
    >
      <BagIcon />
      <span className="hidden sm:inline">Cart</span>
      {error ? (
        <span className="text-bad" aria-hidden="true">!</span>
      ) : (
        count !== null &&
        count > 0 && (
          <span
            className="num absolute -right-2 -top-2 grid h-[1.4rem] min-w-[1.4rem] place-items-center rounded-full bg-tag px-1 text-xs font-extrabold text-tag-ink ring-2 ring-paper"
            aria-hidden="true"
          >
            {count}
          </span>
        )
      )}
    </Link>
  );
}
