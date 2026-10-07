import type { CartItemInput, CustomerCart } from "./types";

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { code?: string; message?: string }
      | null;
    throw new Error(body?.message ?? `Cart request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
};

export const getCustomerCart = (): Promise<CustomerCart> => request("/api/cart");

export const addCustomerCartItem = (item: CartItemInput): Promise<CustomerCart> =>
  request("/api/cart/items", { method: "POST", body: JSON.stringify(item) });

export const updateCustomerCartItem = (
  cartItemId: number,
  quantity: number,
): Promise<CustomerCart> =>
  request(`/api/cart/items/${cartItemId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });

export const removeCustomerCartItem = (cartItemId: number): Promise<CustomerCart> =>
  request(`/api/cart/items/${cartItemId}`, { method: "DELETE" });

export const mergeCustomerCart = (items: CartItemInput[]): Promise<CustomerCart> =>
  request("/api/cart/merge", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
