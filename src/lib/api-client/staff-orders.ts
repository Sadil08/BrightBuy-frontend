// 08-order-tracking-status, staff side. The backend enforces `order:status:update` / `order:cancel`;
// the status guard (valid next states) is the backend's too — `nextStatuses` is only what to OFFER.
import { apiFetch } from "./index";
import type { Order, OrderPage, OrderStatus } from "./orders";

export interface StaffOrder extends Order {
  nextStatuses: OrderStatus[];
}

export function listStaffOrders(
  cookieHeader: string,
  params: { status?: OrderStatus; page?: number; size?: number } = {},
): Promise<OrderPage> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  const qs = query.toString();
  return apiFetch<OrderPage>(`/staff/orders${qs ? `?${qs}` : ""}`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
}

export function getStaffOrder(cookieHeader: string, orderId: number): Promise<StaffOrder> {
  return apiFetch<StaffOrder>(`/staff/orders/${orderId}`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
}

/** Resolves with nothing on success (204); an illegal move is a 409 INVALID_TRANSITION ApiError. */
export async function updateOrderStatus(cookieHeader: string, orderId: number, status: OrderStatus): Promise<void> {
  await apiFetch<void>(`/staff/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { Cookie: cookieHeader },
    body: JSON.stringify({ status }),
    cache: "no-store",
  });
}
