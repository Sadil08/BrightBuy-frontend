// Typed functions for 04-checkout-orders. Field names match specs/openapi/openapi.yaml's `Order`,
// `OrderItem`, `CheckoutRequest` exactly. Server-only (they need the caller's cookie).
import { apiFetch } from "./index";
import type { Money } from "./catalog";

export type OrderStatus =
  | "Placed"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "ReadyForPickup"
  | "Delivered"
  | "Completed"
  | "Cancelled";

export type PaymentStatus = "Pending" | "Authorized" | "Paid" | "Failed" | "Refunded";
export type DeliveryMode = "StorePickup" | "StandardDelivery";
export type PaymentMethod = "COD" | "Card";

export interface OrderItem {
  variantId: number;
  productName: string;
  quantity: number;
  unitPriceAtOrder: Money;
}

// One row of the order's audit trail (REQ-8.5). `changedBy` (the staff member's email) is only sent on
// staff endpoints; customers see what happened and when.
export interface StatusEvent {
  status: OrderStatus;
  changedAt: string;
  changedBy?: string;
}

export interface Order {
  orderId: number;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: Money;
  taxAmount: Money;
  deliveryFee: Money;
  totalAmount: Money;
  delivery: { mode: DeliveryMode; estimatedDate: string; estimatedDays: number };
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  history?: StatusEvent[];
  customerName?: string; // staff endpoints only
}

export interface OrderPage {
  items: Order[];
  page: { page: number; size: number; total: number };
}

export interface CheckoutRequest {
  deliveryMode: DeliveryMode;
  deliveryCityId?: number;
  deliveryAddress?: string;
  paymentMethod: PaymentMethod;
  card?: { token: string };
}

/** One line the backend names when a checkout is refused for stock (409 STOCK_EXCEEDED). */
export interface UnavailableLine {
  variantId: number;
  productName: string;
  requested: number;
  available: number;
}

export function placeOrder(cookieHeader: string, idempotencyKey: string, body: CheckoutRequest): Promise<Order> {
  return apiFetch<Order>("/checkout", {
    method: "POST",
    headers: { Cookie: cookieHeader, "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

export function listOrders(cookieHeader: string, page = 1, size = 10): Promise<OrderPage> {
  return apiFetch<OrderPage>(`/orders?page=${page}&size=${size}`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
}

export function getOrder(cookieHeader: string, orderId: number): Promise<Order> {
  return apiFetch<Order>(`/orders/${orderId}`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
}
