"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { City } from "@/lib/api-client/delivery";
import type { Order, UnavailableLine } from "@/lib/api-client/orders";
import { notifyCustomerCartChanged } from "@/lib/cart/events";
import type { CustomerCart } from "@/lib/cart/types";
import { formatUsd } from "@/lib/money";
import { ProductArt } from "@/components/ProductArt";
import { AlertIcon, ArrowLeftIcon, LockIcon } from "@/components/icons";
import { DeliveryEstimate, type DeliveryChoice } from "../_components/DeliveryEstimate";

type Payment = "COD" | "Card";
// Phase 1 uses a payment STUB (REQ-7.7): no card details are collected or sent anywhere. The "card"
// is a test token the stub understands, so a developer or examiner can exercise both outcomes.
const TEST_TOKENS = [
  { token: "tok_approved", label: "Approved test card" },
  { token: "tok_decline", label: "Declined test card" },
];

interface Failure {
  kind: "stock" | "payment" | "other";
  message: string;
  lines?: UnavailableLine[];
}

export function CheckoutForm({ cart, cities, customerName }: { cart: CustomerCart; cities: City[]; customerName: string }) {
  const router = useRouter();
  const [delivery, setDelivery] = useState<DeliveryChoice>({ mode: "StorePickup" });
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState<Payment>("COD");
  const [token, setToken] = useState(TEST_TOKENS[0]!.token);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);

  // One idempotency key per checkout ATTEMPT (FR-CHECKOUT-9, tasks T7). It is reused if the same
  // attempt is retried (a double-click, a dropped connection), so the server returns the same order
  // instead of making a second. It is replaced only after a definitive answer that left no order
  // behind (stock or payment refusal), so the customer's next try is a genuinely new attempt.
  const keyRef = useRef<string | null>(null);
  const attemptKey = () => (keyRef.current ??= crypto.randomUUID());

  const standard = delivery.mode === "StandardDelivery";
  const addressMissing = standard && address.trim() === "";
  const cityMissing = standard && delivery.cityId === undefined;
  const canSubmit = !submitting && !addressMissing && !cityMissing;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setFailure(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": attemptKey() },
        body: JSON.stringify({
          deliveryMode: delivery.mode,
          ...(standard ? { deliveryCityId: delivery.cityId, deliveryAddress: address.trim() } : {}),
          paymentMethod: payment,
          ...(payment === "Card" ? { card: { token } } : {}),
        }),
      });

      if (response.status === 401) {
        router.push("/login?next=/checkout");
        return;
      }
      const body = (await response.json().catch(() => ({}))) as Partial<Order> & {
        code?: string;
        message?: string;
        unavailableLines?: UnavailableLine[];
      };

      if (response.status === 201 && body.orderId) {
        notifyCustomerCartChanged(); // the server emptied the cart in the same transaction
        router.push(`/orders/${body.orderId}?placed=1`);
        return;
      }

      if (response.status === 409 && body.code === "STOCK_EXCEEDED") {
        keyRef.current = null;
        setFailure({ kind: "stock", message: "Some items just sold out. Nothing was ordered or charged.", lines: body.unavailableLines });
      } else if (response.status === 409 && body.code === "PAYMENT_FAILED") {
        keyRef.current = null;
        setFailure({ kind: "payment", message: "Your card was declined. Nothing was ordered, and your cart is untouched." });
      } else if (response.status >= 400 && response.status < 500) {
        keyRef.current = null;
        setFailure({ kind: "other", message: body.message ?? "We couldn't place your order. Check your details and try again." });
      } else {
        // 5xx: we can't know whether the order went through. KEEP the key, so pressing the button
        // again is a safe retry rather than a possible second order.
        setFailure({ kind: "other", message: "Something went wrong on our side. It's safe to try again: you won't be charged twice." });
      }
    } catch {
      // Network failure: same reasoning, keep the key.
      setFailure({ kind: "other", message: "We couldn't reach the shop. Check your connection and try again: you won't be charged twice." });
    } finally {
      setSubmitting(false);
    }
  }

  const estimateItems = cart.items.filter((i) => !i.unavailable).map((i) => ({ variantId: i.variantId, quantity: i.quantity }));

  return (
    <main className="container-page py-10">
      <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft no-underline hover:text-ink">
        <ArrowLeftIcon /> Back to cart
      </Link>
      <h1 className="mt-4 text-4xl font-extrabold">Checkout</h1>
      <p className="mt-1 text-ink-soft">Hi {customerName.split(" ")[0]}, two quick choices and you&apos;re done.</p>

      <form onSubmit={submit} className="mt-8 grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]" noValidate>
        <div className="flex flex-col gap-6">
          {failure && (
            <div role="alert" className="alert alert-bad flex-col !items-stretch gap-3">
              <p className="flex items-center gap-2 font-bold"><AlertIcon /> {failure.message}</p>
              {failure.lines && failure.lines.length > 0 && (
                <ul className="flex flex-col gap-1.5 rounded-lg bg-surface/70 p-3 text-sm text-ink">
                  {failure.lines.map((line) => (
                    <li key={line.variantId} className="flex justify-between gap-3">
                      <span className="font-semibold">{line.productName}</span>
                      <span className="num text-ink-soft">you asked for {line.requested}, {line.available} left</span>
                    </li>
                  ))}
                </ul>
              )}
              {failure.kind === "stock" && (
                <Link href="/cart" className="btn btn-outline btn-sm self-start">Update my cart</Link>
              )}
            </div>
          )}

          <section className="card p-6" aria-labelledby="step-delivery">
            <h2 id="step-delivery" className="flex items-center gap-3 text-xl font-extrabold">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink font-display text-sm text-paper">1</span> Delivery
            </h2>
            <div className="mt-5 flex flex-col gap-5">
              <DeliveryEstimate cities={cities} items={estimateItems} value={delivery} onChange={setDelivery} />
              {standard && (
                <div>
                  <label htmlFor="address" className="label">Street address</label>
                  <input
                    id="address"
                    className="input"
                    autoComplete="street-address"
                    maxLength={255}
                    placeholder="123 Main St, Apt 4"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    aria-invalid={addressMissing && failure !== null}
                  />
                </div>
              )}
            </div>
          </section>

          <section className="card p-6" aria-labelledby="step-payment">
            <h2 id="step-payment" className="flex items-center gap-3 text-xl font-extrabold">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink font-display text-sm text-paper">2</span> Payment
            </h2>
            <fieldset className="mt-5">
              <legend className="sr-only">Payment method</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { value: "COD", title: "Cash on delivery", body: "Pay when your order arrives or when you collect it." },
                    { value: "Card", title: "Card", body: "Authorized now, charged when the order is confirmed." },
                  ] as const
                ).map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer flex-col gap-1 rounded-xl border-[1.5px] p-4 transition has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-action ${
                      payment === option.value ? "border-action bg-action-soft" : "border-line-strong bg-surface hover:border-ink"
                    }`}
                  >
                    <input type="radio" name="payment" className="sr-only" checked={payment === option.value} onChange={() => setPayment(option.value)} />
                    <span className="font-bold">{option.title}</span>
                    <span className="text-sm text-ink-soft">{option.body}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {payment === "Card" && (
              <div className="mt-5 flex flex-col gap-3">
                <p className="alert alert-info text-sm">
                  <LockIcon className="mt-0.5 shrink-0" />
                  <span>Payments run in test mode. No card number is asked for, stored or sent. Pick how the test card should behave.</span>
                </p>
                <div>
                  <label htmlFor="test-card" className="label">Test card</label>
                  <select id="test-card" className="input" value={token} onChange={(e) => setToken(e.target.value)}>
                    {TEST_TOKENS.map((t) => <option key={t.token} value={t.token}>{t.label}</option>)}
                  </select>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="card flex flex-col gap-5 p-5 lg:sticky lg:top-24" aria-labelledby="step-review">
          <h2 id="step-review" className="flex items-center gap-3 text-xl font-extrabold">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-ink font-display text-sm text-paper">3</span> Review
          </h2>
          <ul className="flex flex-col gap-3">
            {cart.items.map((item) => (
              <li key={item.cartItemId} className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg"><ProductArt seed={item.variantId} label={item.productName} className="h-full w-full" letters={false} /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{item.productName}</p>
                  <p className="num text-xs text-ink-soft">{item.quantity} × {formatUsd(item.unitPrice)}</p>
                </div>
                <p className="num text-sm font-bold">{formatUsd(item.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <dl className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="num font-semibold">{formatUsd(cart.subtotal)}</dd></div>
            <div className="flex justify-between text-ink-soft"><dt>Tax</dt><dd>Calculated when you confirm</dd></div>
            <div className="flex justify-between text-ink-soft"><dt>Delivery fee</dt><dd>{standard ? "Calculated when you confirm" : "Free (store pickup)"}</dd></div>
          </dl>
          <button type="submit" disabled={!canSubmit} className="btn btn-primary btn-lg">
            <LockIcon /> {submitting ? "Placing your order…" : "Place order"}
          </button>
          {(addressMissing || cityMissing) && (
            <p className="text-center text-xs text-ink-faint">
              {cityMissing ? "Choose a delivery city" : "Enter a street address"} to continue.
            </p>
          )}
          <p className="text-center text-xs text-ink-faint">
            Press the button twice and you still get one order. The final total is shown on your confirmation.
          </p>
        </aside>
      </form>
    </main>
  );
}
