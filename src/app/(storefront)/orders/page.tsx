import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listOrders } from "@/lib/api-client/orders";
import { cookieHeaderFromRequest, requireUser } from "@/lib/auth/session";
import { formatUsd } from "@/lib/money";
import { ArrowLeftIcon, BoxIcon, ChevronRightIcon } from "@/components/icons";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

export const metadata: Metadata = { title: "My orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser();
  if (user.role !== "CUSTOMER") redirect("/");

  const page = Math.max(1, Number((await searchParams).page) || 1);
  const { items, page: info } = await listOrders(await cookieHeaderFromRequest(), page, 10);
  const totalPages = Math.max(1, Math.ceil(info.total / info.size));

  return (
    <main className="container-page py-10">
      <p className="eyebrow">Account</p>
      <h1 className="mt-2 text-4xl font-extrabold">My orders</h1>

      {items.length === 0 ? (
        <div className="card-flat mt-8 grid place-items-center gap-3 px-6 py-20 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-action-soft text-action"><BoxIcon className="h-8 w-8" /></span>
          <p className="font-display text-2xl font-extrabold">No orders yet.</p>
          <p className="max-w-sm text-ink-soft">When you place an order it will show up here with its status and delivery date.</p>
          <Link href="/products" className="btn btn-primary btn-lg mt-2">Start shopping</Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {items.map((order) => (
            <li key={order.orderId}>
              <Link href={`/orders/${order.orderId}`} className="card group flex flex-wrap items-center gap-x-6 gap-y-3 p-5 no-underline transition hover:shadow-lift">
                <div className="min-w-[8rem]">
                  <p className="eyebrow">Order</p>
                  <p className="font-mono text-lg font-medium text-ink">#{order.orderId}</p>
                </div>
                <div className="min-w-[8rem]">
                  <p className="eyebrow">Placed</p>
                  <p className="text-sm font-semibold text-ink">{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-soft">
                    {order.items.map((item) => `${item.quantity} × ${item.productName}`).join(", ")}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
                <p className="num font-display text-xl font-extrabold text-ink">{formatUsd(order.totalAmount)}</p>
                <ChevronRightIcon className="text-ink-faint transition group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3">
          {info.page > 1 ? <Link className="btn btn-outline" href={`/orders?page=${info.page - 1}`}><ArrowLeftIcon /> Newer</Link> : <span className="btn btn-outline invisible" aria-hidden="true">Newer</span>}
          <span className="num text-sm font-semibold text-ink-soft">Page {info.page} of {totalPages}</span>
          {info.page < totalPages ? <Link className="btn btn-outline" href={`/orders?page=${info.page + 1}`}>Older <ChevronRightIcon /></Link> : <span className="btn btn-outline invisible" aria-hidden="true">Older</span>}
        </nav>
      )}
    </main>
  );
}
