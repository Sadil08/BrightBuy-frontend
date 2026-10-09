import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CustomerCart } from "@/lib/cart/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));

import { CheckoutForm } from "./CheckoutForm";

const cart: CustomerCart = {
  cartId: 1,
  subtotal: "20.00",
  items: [
    { cartItemId: 5, variantId: 11, productName: "BrightBook", unitPrice: "10.00", quantity: 2, lineTotal: "20.00", stockWarning: false, unavailable: false },
  ],
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

// The delivery-estimate widget also calls fetch; answer it quietly so the tests only inspect checkout.
function mockFetch(checkout: () => Response | Promise<Response>) {
  const calls: { key: string | null; body: Record<string, unknown> }[] = [];
  vi.spyOn(window, "fetch").mockImplementation(async (input, init) => {
    if (String(input).includes("/api/delivery/estimate")) {
      return json(200, { mode: "StorePickup", estimatedDate: "2026-10-14", estimatedDays: 0 });
    }
    const headers = new Headers(init?.headers);
    calls.push({ key: headers.get("Idempotency-Key"), body: JSON.parse(String(init?.body)) });
    return checkout();
  });
  return calls;
}

beforeEach(() => {
  push.mockClear();
  vi.restoreAllMocks();
});

describe("checkout", () => {
  it("sends the chosen options and goes to the order page on success", async () => {
    const calls = mockFetch(() => json(201, { orderId: 42 }));
    render(<CheckoutForm cart={cart} cities={[]} customerName="Ada Lovelace" />);

    fireEvent.click(screen.getByRole("button", { name: /place order/i }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/orders/42?placed=1"));
    expect(calls[0]!.body).toEqual({ deliveryMode: "StorePickup", paymentMethod: "COD" });
    expect(calls[0]!.key).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("reuses the same idempotency key when a failed attempt is retried (5xx: we can't know if it went through)", async () => {
    let n = 0;
    const calls = mockFetch(() => (n++ === 0 ? json(500, { code: "INTERNAL_ERROR", message: "x" }) : json(201, { orderId: 7 })));
    render(<CheckoutForm cart={cart} cities={[]} customerName="Ada" />);

    fireEvent.click(screen.getByRole("button", { name: /place order/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/won't be charged twice/i);
    fireEvent.click(screen.getByRole("button", { name: /place order/i }));
    await waitFor(() => expect(push).toHaveBeenCalled());

    expect(calls).toHaveLength(2);
    expect(calls[1]!.key).toBe(calls[0]!.key);
  });

  it("uses a NEW key after a definitive refusal that left no order behind", async () => {
    let n = 0;
    const calls = mockFetch(() => (n++ === 0 ? json(409, { code: "PAYMENT_FAILED", message: "declined" }) : json(201, { orderId: 8 })));
    render(<CheckoutForm cart={cart} cities={[]} customerName="Ada" />);

    fireEvent.click(screen.getByRole("button", { name: /place order/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/card was declined/i);
    fireEvent.click(screen.getByRole("button", { name: /place order/i }));
    await waitFor(() => expect(push).toHaveBeenCalled());

    expect(calls[1]!.key).not.toBe(calls[0]!.key);
  });

  it("names the items that sold out and keeps the customer on the page (AC-CHECKOUT-2)", async () => {
    mockFetch(() =>
      json(409, {
        code: "STOCK_EXCEEDED",
        message: "x",
        unavailableLines: [{ variantId: 11, productName: "BrightBook", requested: 2, available: 1 }],
      }),
    );
    render(<CheckoutForm cart={cart} cities={[]} customerName="Ada" />);

    fireEvent.click(screen.getByRole("button", { name: /place order/i }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/sold out/i);
    expect(alert).toHaveTextContent("BrightBook");
    expect(alert).toHaveTextContent(/you asked for 2, 1 left/i);
    expect(push).not.toHaveBeenCalled();
  });

  it("requires a city and street address before Standard Delivery can be placed", async () => {
    mockFetch(() => json(201, { orderId: 1 }));
    render(<CheckoutForm cart={cart} cities={[{ cityId: 3, name: "Austin" }]} customerName="Ada" />);

    fireEvent.click(screen.getByLabelText(/^Delivery$/));
    expect(screen.getByRole("button", { name: /place order/i })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Delivery city"), { target: { value: "3" } });
    expect(screen.getByRole("button", { name: /place order/i })).toBeDisabled(); // still no address
    fireEvent.change(screen.getByLabelText("Street address"), { target: { value: "1 Main St" } });
    expect(screen.getByRole("button", { name: /place order/i })).toBeEnabled();
  });

  it("sends the test card token, never a card number, when paying by card", async () => {
    const calls = mockFetch(() => json(201, { orderId: 9 }));
    render(<CheckoutForm cart={cart} cities={[]} customerName="Ada" />);

    fireEvent.click(screen.getByLabelText(/^Card/));
    fireEvent.click(screen.getByRole("button", { name: /place order/i }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(calls[0]!.body.card).toEqual({ token: "tok_approved" });
    expect(JSON.stringify(calls[0]!.body)).not.toMatch(/\d{12,}/);
  });
});
