import type { Metadata } from "next";
import Link from "next/link";
import { ApiError } from "@/lib/api-client";
import type { OrderStatus } from "@/lib/api-client/orders";
import { listStaffOrders } from "@/lib/api-client/staff-orders";
import { cookieHeaderFromRequest, requireToolAccess } from "@/lib/auth/session";
import { formatUsd } from "@/lib/money";
import { ArrowLeftIcon, ChevronRightIcon } from "@/components/icons";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/OrderStatusBadge";

export const metadata: Metadata = { title: "Orders" };

const PAGE_SIZE = 20;
const FILTERS: { label: string; status?: OrderStatus }[] = [
  { label: "All" },
  { label: "Confirmed", status: "Confirmed" },
  { label: "Processing", status: "Processing" },
  { label: "Shipped", status: "Shipped" },
  { label: "Ready for pickup", status: "ReadyForPickup" },
  { label: "Delivered", status: "Delivered" },
  { label: "Completed", status: "Completed" },
  { label: "Cancelled", status: "Cancelled" },
];

export default async function StaffOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  await requireToolAccess("/admin/orders");
  const raw = await searchParams;
  const status = FILTERS.find((f) => f.status && f.status === raw.status)?.status;
  const page = Math.max(1, Number(raw.page) || 1);

  let result;
  try {
    result = await listStaffOrders(await cookieHeaderFromRequest(), { status, page, size: PAGE_SIZE });
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return (
        <main className="p-4 sm:p-10">
          <h1 className="text-3xl font-extrabold sm:text-4xl">Orders</h1>
          <p className="alert alert-bad mt-6 max-w-xl">Your role doesn&apos;t have permission to manage orders. Ask an administrator to grant order:status:update.</p>
        </main>
      );
    }
    throw error;
  }

  const { items, page: info } = result;
  const totalPages = Math.max(1, Math.ceil(info.total / info.size));
  const href = (p: number, s = status) => `/admin/orders?${new URLSearchParams({ ...(s ? { status: s } : {}), page: String(p) })}`;

  return (
    <main className="p-4 sm:p-10">
      <p className="eyebrow">Fulfilment</p>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Orders</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">Newest first. Open an order to move it through fulfilment or cancel it.</p>

      <nav aria-label="Filter by status" className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.map((f) => (
          <Link key={f.label} href={href(1, f.status)} className="chip whitespace-nowrap no-underline" aria-current={f.status === status}>{f.label}</Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <div className="card-flat mt-6 grid place-items-center gap-2 px-6 py-16 text-center">
          <p className="font-display text-2xl font-extrabold">No orders here.</p>
          <p className="text-ink-soft">{status ? "No orders have this status." : "Orders appear as soon as customers check out."}</p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {items.map((order) => (
            <li key={order.orderId}>
              <Link href={`/admin/orders/${order.orderId}`} className="card group flex flex-wrap items-center gap-x-5 gap-y-2 p-4 no-underline transition hover:shadow-lift sm:p-5">
                <div className="w-20">
                  <p className="eyebrow">Order</p>
                  <p className="font-mono text-lg text-ink">#{order.orderId}</p>
                </div>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="truncate font-bold text-ink">{order.customerName}</p>
                  <p className="num text-xs text-ink-soft">
                    {new Date(order.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} · {order.delivery.mode === "StorePickup" ? "Pickup" : "Delivery"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2"><OrderStatusBadge status={order.status} /><PaymentStatusBadge status={order.paymentStatus} /></div>
                <p className="num font-display text-lg font-extrabold text-ink sm:w-28 sm:text-right">{formatUsd(order.totalAmount)}</p>
                <ChevronRightIcon className="hidden text-ink-faint transition group-hover:translate-x-1 sm:block" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="num mt-4 text-sm text-ink-faint">{info.total} order{info.total === 1 ? "" : "s"}</p>
      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center gap-3">
          {info.page > 1 ? <Link className="btn btn-outline" href={href(info.page - 1)}><ArrowLeftIcon /> Previous</Link> : <span className="btn btn-outline invisible" aria-hidden="true">Previous</span>}
          <span className="num text-sm font-semibold text-ink-soft">Page {info.page} of {totalPages}</span>
          {info.page < totalPages ? <Link className="btn btn-outline" href={href(info.page + 1)}>Next <ChevronRightIcon /></Link> : <span className="btn btn-outline invisible" aria-hidden="true">Next</span>}
        </nav>
      )}
    </main>
  );
}
