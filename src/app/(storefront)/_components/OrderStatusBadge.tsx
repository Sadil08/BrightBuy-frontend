import type { OrderStatus, PaymentStatus } from "@/lib/api-client/orders";

const STATUS: Record<OrderStatus, { label: string; tone: string }> = {
  Placed: { label: "Placed", tone: "badge-neutral" },
  Confirmed: { label: "Confirmed", tone: "badge-action" },
  Processing: { label: "Processing", tone: "badge-action" },
  Shipped: { label: "Shipped", tone: "badge-action" },
  ReadyForPickup: { label: "Ready for pickup", tone: "badge-good" },
  Delivered: { label: "Delivered", tone: "badge-good" },
  Completed: { label: "Completed", tone: "badge-good" },
  Cancelled: { label: "Cancelled", tone: "badge-bad" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS[status] ?? { label: status, tone: "badge-neutral" };
  return <span className={`badge ${s.tone}`}>{s.label}</span>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tone = status === "Paid" ? "badge-good" : status === "Failed" ? "badge-bad" : status === "Refunded" ? "badge-warn" : "badge-neutral";
  return <span className={`badge ${tone}`}>Payment {status.toLowerCase()}</span>;
}
