"use client";

import { useActionState, useState } from "react";
import { updateOrderStatusAction, type OrderStatusFormState } from "@/app/actions/staff-orders";
import type { OrderStatus } from "@/lib/api-client/orders";

const LABEL: Record<OrderStatus, string> = {
  Placed: "Placed", Confirmed: "Confirmed", Processing: "Processing", Shipped: "Shipped",
  ReadyForPickup: "Ready for pickup", Delivered: "Delivered", Completed: "Completed", Cancelled: "Cancelled",
};

const initial: OrderStatusFormState = {};

// The buttons are only a convenience: they offer the moves the backend says are valid right now
// (`nextStatuses`). The database trigger + service are what actually refuse an illegal transition.
export function StatusActions({ orderId, nextStatuses }: { orderId: number; nextStatuses: OrderStatus[] }) {
  const [state, action, pending] = useActionState(updateOrderStatusAction, initial);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const advance = nextStatuses.filter((s) => s !== "Cancelled");
  const canCancel = nextStatuses.includes("Cancelled");

  if (nextStatuses.length === 0) {
    return <p className="text-sm text-ink-soft">This order is in a final state — no further changes are possible.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {state.error && <p role="alert" className="alert alert-bad">{state.error}</p>}
      {state.success && <p role="status" className="alert alert-good">{state.success}</p>}

      <form action={action} className="flex flex-wrap gap-2">
        <input type="hidden" name="orderId" value={orderId} />
        {advance.map((status) => (
          <button key={status} type="submit" name="status" value={status} className="btn btn-primary" disabled={pending}>
            Mark {LABEL[status].toLowerCase()}
          </button>
        ))}
      </form>

      {canCancel && (
        confirmingCancel ? (
          <form action={action} className="alert alert-warn flex flex-col gap-3">
            <input type="hidden" name="orderId" value={orderId} />
            <p className="text-sm font-semibold">Cancel this order? Reserved stock is returned to inventory. This cannot be undone.</p>
            <div className="flex flex-wrap gap-2">
              <button type="submit" name="status" value="Cancelled" className="btn btn-danger btn-sm" disabled={pending}>
                {pending ? "Cancelling…" : "Yes, cancel order"}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmingCancel(false)}>Keep order</button>
            </div>
          </form>
        ) : (
          <button type="button" className="btn btn-outline btn-sm self-start" onClick={() => setConfirmingCancel(true)}>Cancel order…</button>
        )
      )}
    </div>
  );
}
