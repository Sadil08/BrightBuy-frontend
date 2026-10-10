"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api-client";
import { updateOrderStatus } from "@/lib/api-client/staff-orders";
import type { OrderStatus } from "@/lib/api-client/orders";
import { withSilentRefresh } from "@/lib/auth/with-silent-refresh";

export interface OrderStatusFormState {
  error?: string;
  success?: string;
}

const MESSAGES: Record<string, string> = {
  INVALID_TRANSITION: "That move isn't allowed from the order's current status. Refresh and try again.",
  FORBIDDEN: "Your role isn't allowed to make that change.",
  ORDER_NOT_FOUND: "That order no longer exists.",
};

// One action drives both "advance" and "cancel": the backend routes status=Cancelled to the
// stock-returning cancel path and checks order:cancel vs order:status:update itself.
export async function updateOrderStatusAction(_prev: OrderStatusFormState, formData: FormData): Promise<OrderStatusFormState> {
  const orderId = Number(formData.get("orderId"));
  const status = String(formData.get("status") ?? "") as OrderStatus;
  if (!Number.isInteger(orderId) || orderId <= 0 || !status) return { error: "Choose a status first." };

  try {
    await withSilentRefresh((cookie) => updateOrderStatus(cookie, orderId, status));
  } catch (err) {
    if (err instanceof ApiError) return { error: MESSAGES[err.code] ?? err.message };
    throw err;
  }
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return { success: `Order #${orderId} is now ${status}.` };
}
