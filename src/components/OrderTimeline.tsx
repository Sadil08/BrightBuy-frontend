import type { StatusEvent } from "@/lib/api-client/orders";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

// The order's audit trail, oldest first (REQ-8.5). Shared by the customer's order page and the staff
// console; `changedBy` only exists on staff responses, so it simply doesn't render for customers.
export function OrderTimeline({ history }: { history: StatusEvent[] }) {
  if (history.length === 0) return null;
  return (
    <ol className="flex flex-col" aria-label="Order history">
      {history.map((event, i) => (
        <li key={`${event.status}-${event.changedAt}-${i}`} className="relative flex gap-3 pb-5 last:pb-0">
          <span aria-hidden="true" className="relative flex flex-col items-center">
            <span className={`mt-1.5 h-3 w-3 rounded-full ${i === history.length - 1 ? "bg-action" : "bg-line-strong"}`} />
            {i < history.length - 1 && <span className="mt-1 w-px flex-1 bg-line" />}
          </span>
          <div className="min-w-0">
            <OrderStatusBadge status={event.status} />
            <p className="num mt-1 text-xs text-ink-soft">
              {new Date(event.changedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
              {event.changedBy ? ` · ${event.changedBy}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
