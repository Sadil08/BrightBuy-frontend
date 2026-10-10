import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { getStaffOrder } from "@/lib/api-client/staff-orders";
import { cookieHeaderFromRequest, requireToolAccess } from "@/lib/auth/session";
import { formatEstimateDate } from "@/lib/dates";
import { formatUsd, moneyToCents } from "@/lib/money";
import { ArrowLeftIcon } from "@/components/icons";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/OrderStatusBadge";
import { OrderTimeline } from "@/components/OrderTimeline";
import { StatusActions } from "./StatusActions";

export const metadata: Metadata = { title: "Order" };

export default async function StaffOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  await requireToolAccess("/admin/orders");
  const id = Number((await params).orderId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  let order;
  try {
    order = await getStaffOrder(await cookieHeaderFromRequest(), id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const pickup = order.delivery.mode === "StorePickup";

  return (
    <main className="p-4 sm:p-10">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft no-underline hover:text-ink"><ArrowLeftIcon /> All orders</Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Order</p>
          <h1 className="font-mono text-3xl font-medium sm:text-4xl">#{order.orderId}</h1>
          <p className="mt-1 text-sm text-ink-soft">{order.customerName} · placed {new Date(order.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
        </div>
        <div className="flex flex-wrap gap-2"><OrderStatusBadge status={order.status} /><PaymentStatusBadge status={order.paymentStatus} /></div>
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <section className="card p-4 sm:p-5" aria-labelledby="actions-heading">
            <h2 id="actions-heading" className="text-xl font-extrabold">Update status</h2>
            <div className="mt-4"><StatusActions orderId={order.orderId} nextStatuses={order.nextStatuses} /></div>
            {order.paymentMethod === "COD" && order.paymentStatus !== "Paid" && order.status !== "Cancelled" && (
              <p className="hint mt-3">Cash on delivery: payment is marked Paid automatically when you mark the order Delivered.</p>
            )}
          </section>

          <section className="card overflow-hidden" aria-labelledby="items-heading">
            <h2 id="items-heading" className="border-b border-line p-4 text-xl font-extrabold sm:p-5">Items</h2>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.variantId} className="flex items-center justify-between gap-4 p-4 sm:px-5">
                  <div className="min-w-0"><p className="truncate font-bold">{item.productName}</p><p className="num text-sm text-ink-soft">{item.quantity} × {formatUsd(item.unitPriceAtOrder)}</p></div>
                  <p className="num font-display text-lg font-extrabold">{formatUsd(moneyToCents(item.unitPriceAtOrder) * item.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="grid gap-1 border-t border-line p-4 text-sm sm:p-5">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="num">{formatUsd(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Tax</dt><dd className="num">{formatUsd(order.taxAmount)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Delivery fee</dt><dd className="num">{formatUsd(order.deliveryFee)}</dd></div>
              <div className="mt-2 flex justify-between border-t border-line pt-3"><dt className="font-bold">Total</dt><dd className="num font-display text-xl font-extrabold">{formatUsd(order.totalAmount)}</dd></div>
            </dl>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="card p-4 sm:p-5" aria-labelledby="delivery-heading">
            <h2 id="delivery-heading" className="text-xl font-extrabold">{pickup ? "Pickup" : "Delivery"}</h2>
            <p className="mt-2 text-sm text-ink-soft">{pickup ? "Store pickup" : "Standard delivery"} · estimated {formatEstimateDate(order.delivery.estimatedDate)}</p>
            <p className="mt-1 text-sm text-ink-soft">Payment: {order.paymentMethod === "COD" ? "Cash on delivery" : "Card"}</p>
          </section>
          <section className="card p-4 sm:p-5" aria-labelledby="history-heading">
            <h2 id="history-heading" className="mb-4 text-xl font-extrabold">History</h2>
            <OrderTimeline history={order.history ?? []} />
          </section>
        </div>
      </div>
    </main>
  );
}
