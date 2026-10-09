import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { getOrder } from "@/lib/api-client/orders";
import { cookieHeaderFromRequest, requireUser } from "@/lib/auth/session";
import { formatEstimateDate } from "@/lib/dates";
import { formatUsd, moneyToCents } from "@/lib/money";
import { ProductArt } from "@/components/ProductArt";
import { ArrowLeftIcon, CheckIcon, StoreIcon, TruckIcon } from "@/components/icons";
import { OrderStatusBadge, PaymentStatusBadge } from "../../_components/OrderStatusBadge";

export const metadata: Metadata = { title: "Order details" };

type Props = { params: Promise<{ orderId: string }>; searchParams: Promise<{ placed?: string }> };

export default async function OrderDetailPage({ params, searchParams }: Props) {
  const user = await requireUser();
  if (user.role !== "CUSTOMER") redirect("/");

  const id = Number((await params).orderId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  let order;
  try {
    order = await getOrder(await cookieHeaderFromRequest(), id);
  } catch (error) {
    // The backend answers 404 for someone else's order exactly as it does for one that doesn't
    // exist (AC-CHECKOUT-7), so this page can't be used to find out which order numbers are real.
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const justPlaced = (await searchParams).placed === "1";
  const pickup = order.delivery.mode === "StorePickup";

  return (
    <main className="container-page py-10">
      <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft no-underline hover:text-ink">
        <ArrowLeftIcon /> All orders
      </Link>

      {justPlaced && (
        <section className="rise mt-6 flex flex-wrap items-center gap-5 rounded-[var(--radius)] bg-good-soft p-6 text-good" role="status">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-good text-paper"><CheckIcon className="h-8 w-8" strokeWidth={2.6} /></span>
          <div>
            <h2 className="text-3xl font-extrabold">Order placed. Thank you!</h2>
            <p className="mt-1 text-good/90">
              {pickup ? "We'll have it ready for you." : "We'll get it on its way."} Your cart has been emptied.
            </p>
          </div>
        </section>
      )}

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Order</p>
          <h1 className="font-mono text-4xl font-medium">#{order.orderId}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Placed {new Date(order.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="card overflow-hidden" aria-labelledby="items-heading">
          <h2 id="items-heading" className="border-b border-line p-5 text-xl font-extrabold">Items</h2>
          <ul className="divide-y divide-line">
            {order.items.map((item) => (
              <li key={item.variantId} className="flex items-center gap-4 p-5">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl"><ProductArt seed={item.variantId} label={item.productName} className="h-full w-full" letters={false} /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{item.productName}</p>
                  {/* AC-CHECKOUT-6: this is the price at the moment of the order, not today's price. */}
                  <p className="num text-sm text-ink-soft">{item.quantity} × {formatUsd(item.unitPriceAtOrder)}</p>
                </div>
                <p className="num font-display text-lg font-extrabold">{formatUsd(moneyToCents(item.unitPriceAtOrder) * item.quantity)}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-6">
          <section className="card p-5" aria-labelledby="delivery-heading">
            <h2 id="delivery-heading" className="text-xl font-extrabold">{pickup ? "Pickup" : "Delivery"}</h2>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-action-soft p-4 text-action">
              {pickup ? <StoreIcon className="h-7 w-7" /> : <TruckIcon className="h-7 w-7" />}
              <div>
                <p className="font-display text-lg font-extrabold leading-tight">
                  {order.delivery.estimatedDays === 0 ? "Ready today" : `${pickup ? "Ready" : "Arrives by"} ${formatEstimateDate(order.delivery.estimatedDate)}`}
                </p>
                <p className="text-xs opacity-90">{pickup ? "Store pickup" : "Standard delivery"} · {order.delivery.estimatedDays} day{order.delivery.estimatedDays === 1 ? "" : "s"}</p>
              </div>
            </div>
          </section>

          <section className="card p-5" aria-labelledby="totals-heading">
            <h2 id="totals-heading" className="text-xl font-extrabold">Totals</h2>
            <dl className="mt-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="num font-semibold">{formatUsd(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Tax</dt><dd className="num font-semibold">{formatUsd(order.taxAmount)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Delivery fee</dt><dd className="num font-semibold">{formatUsd(order.deliveryFee)}</dd></div>
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
              <span className="font-bold">Total</span>
              <span className="num font-display text-3xl font-extrabold">{formatUsd(order.totalAmount)}</span>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
