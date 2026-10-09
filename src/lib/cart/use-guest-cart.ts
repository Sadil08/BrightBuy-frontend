"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/api-client/catalog";
import {
  GUEST_CART_CHANGED_EVENT,
  loadGuestCart,
} from "./guest-cart";
import { centsToMoney, moneyToCents } from "@/lib/money";
import type { GuestCartLine } from "./types";

export interface PricedGuestCartLine extends GuestCartLine {
  productName: string;
  unitPrice: string;
  lineTotal: string;
  stockWarning: boolean;
  unavailable: boolean;
}

export function useGuestCart(pricesEnabled = true) {
  const [lines, setLines] = useState<GuestCartLine[]>([]);
  const [products, setProducts] = useState<Record<number, Product | null>>({});
  const [loading, setLoading] = useState(pricesEnabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setLines(loadGuestCart());
    refresh();
    window.addEventListener(GUEST_CART_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(GUEST_CART_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const productIds = [...new Set(lines.map((line) => line.productId))];
    if (!pricesEnabled) {
      return () => {
        cancelled = true;
      };
    }
    void Promise.resolve().then(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });

    if (productIds.length === 0) {
      void Promise.resolve().then(() => {
        if (!cancelled) {
          setProducts({});
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    Promise.all(
      productIds.map(async (productId) => {
        const response = await fetch(`/api/products/${productId}`, { cache: "no-store" });
        if (response.status === 404) return [productId, null] as const;
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { message?: string }
            | null;
          throw new Error(body?.message ?? `Product request failed (${response.status})`);
        }
        return [productId, (await response.json()) as Product] as const;
      }),
    )
      .then((entries) => {
        if (!cancelled) setProducts(Object.fromEntries(entries));
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not refresh cart prices.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lines, pricesEnabled]);

  const pricedLines: PricedGuestCartLine[] = lines.map((line) => {
    const product = products[line.productId];
    const variant = product?.variants.find((item) => item.variantId === line.variantId);
    const unavailable = !product || !variant;
    const unitPrice = variant?.price ?? "0.00";
    const lineTotal = centsToMoney(moneyToCents(unitPrice) * line.quantity);
    return {
      ...line,
      productName: product?.name ?? "Unavailable product",
      unitPrice,
      lineTotal,
      stockWarning: variant?.stockStatus === "OUT_OF_STOCK",
      unavailable,
    };
  });

  return {
    lines,
    pricedLines,
    loading,
    error,
    subtotal: pricedLines.reduce((total, line) => total + moneyToCents(line.lineTotal), 0),
  };
}

// Re-exported so existing imports keep working; the implementations live in src/lib/money.ts.
export { moneyToCents } from "@/lib/money";
export { centsToMoney as formatMoney } from "@/lib/money";
