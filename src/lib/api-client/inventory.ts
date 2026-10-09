// Typed functions for 06-inventory-stock (staff-only; the backend enforces `stock:adjust`).
import { apiFetch } from "./index";

export interface StaffVariant {
  variantId: number;
  sku: string;
  productName: string;
  stockQuantity: number; // exact count, staff only (SEC-INVENTORY-2)
}

export interface StaffVariantPage {
  items: StaffVariant[];
  page: { page: number; size: number; total: number };
}

export function searchVariants(
  cookieHeader: string,
  params: { q?: string; page?: number; size?: number } = {},
): Promise<StaffVariantPage> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.page) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  const qs = query.toString();
  return apiFetch<StaffVariantPage>(`/staff/variants${qs ? `?${qs}` : ""}`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
}

export function adjustStock(
  cookieHeader: string,
  variantId: number,
  body: { delta: number; reason: string },
): Promise<{ status: string }> {
  return apiFetch<{ status: string }>(`/staff/variants/${variantId}/stock`, {
    method: "POST",
    headers: { Cookie: cookieHeader },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}
