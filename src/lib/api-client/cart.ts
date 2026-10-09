import { apiFetch } from "./index";
import type { CartItemInput, CustomerCart } from "@/lib/cart/types";

export function getCart(cookieHeader: string): Promise<CustomerCart> {
  return apiFetch<CustomerCart>("/cart", {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
}

export function addCartItem(cookieHeader: string, item: CartItemInput): Promise<CustomerCart> {
  return apiFetch<CustomerCart>("/cart/items", {
    method: "POST",
    headers: { Cookie: cookieHeader },
    body: JSON.stringify(item),
    cache: "no-store",
  });
}

export function updateCartItem(
  cookieHeader: string,
  cartItemId: number,
  quantity: number,
): Promise<CustomerCart> {
  return apiFetch<CustomerCart>(`/cart/items/${cartItemId}`, {
    method: "PATCH",
    headers: { Cookie: cookieHeader },
    body: JSON.stringify({ quantity }),
    cache: "no-store",
  });
}

export function removeCartItem(cookieHeader: string, cartItemId: number): Promise<CustomerCart> {
  return apiFetch<CustomerCart>(`/cart/items/${cartItemId}`, {
    method: "DELETE",
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
}

export function mergeCart(
  cookieHeader: string,
  items: CartItemInput[],
): Promise<CustomerCart> {
  return apiFetch<CustomerCart>("/cart/merge", {
    method: "POST",
    headers: { Cookie: cookieHeader },
    body: JSON.stringify({ items }),
    cache: "no-store",
  });
}
