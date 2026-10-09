import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartClient } from "./CartClient";

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("guest cart page", () => {
  it("refreshes the current product price and recalculates subtotal on quantity updates", async () => {
    window.localStorage.setItem(
      "brightbuy.guestCart.v1",
      JSON.stringify([{ variantId: 11, productId: 1, quantity: 2 }]),
    );
    vi.spyOn(window, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          productId: 1,
          name: "BrightBook",
          description: "Laptop",
          categories: [],
          variants: [{ variantId: 11, sku: "BB-11", price: "799.99", stockStatus: "IN_STOCK", attributes: [] }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<CartClient isCustomer={false} />);

    expect(await screen.findByText("BrightBook")).toBeInTheDocument();
    expect(screen.getByTestId("cart-subtotal")).toHaveTextContent("$1,599.98");
    fireEvent.click(screen.getByRole("button", { name: "Increase quantity for BrightBook" }));
    await waitFor(() => expect(screen.getByText("3", { selector: "span" })).toBeInTheDocument());
    expect(screen.getByTestId("cart-subtotal")).toHaveTextContent("$2,399.97");

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(screen.getByText("Your cart is empty.")).toBeInTheDocument());
  });
});

describe("customer cart page", () => {
  it("shows stock warnings and keeps subtotal in sync with quantity and removal", async () => {
    let quantity = 2;
    const fetchMock = vi.spyOn(window, "fetch").mockImplementation(async (_input, init) => {
      const method = init?.method ?? "GET";
      if (method === "PATCH") {
        quantity = JSON.parse(String(init?.body)).quantity as number;
      } else if (method === "DELETE") {
        quantity = 0;
      }
      const items =
        quantity === 0
          ? []
          : [{
              cartItemId: 5,
              variantId: 11,
              productName: "BrightBook",
              unitPrice: "10.00",
              quantity,
              lineTotal: `${(quantity * 10).toFixed(2)}`,
              stockWarning: true,
              unavailable: false,
            }];
      const cart = { cartId: 1, items, subtotal: `${(quantity * 10).toFixed(2)}` };
      return new Response(JSON.stringify(cart), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    render(<CartClient isCustomer />);

    expect(await screen.findByText("Your quantity exceeds the available stock.")).toBeInTheDocument();
    expect(screen.getByTestId("cart-subtotal")).toHaveTextContent("$20.00");

    fireEvent.click(screen.getByRole("button", { name: "Decrease quantity for BrightBook" }));
    await waitFor(() => expect(screen.getByTestId("cart-subtotal")).toHaveTextContent("$10.00"));

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(screen.getByText("Your cart is empty.")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/cart/items/5",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
