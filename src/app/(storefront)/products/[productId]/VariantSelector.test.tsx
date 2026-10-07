import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { GUEST_CART_KEY } from "@/lib/cart/guest-cart";
import { VariantSelector } from "./VariantSelector";

beforeEach(() => {
  window.localStorage.clear();
});

describe("VariantSelector cart action", () => {
  it("adds the selected variant to the guest cart without storing a price", async () => {
    render(
      <VariantSelector
        productId={7}
        isCustomer={false}
        variants={[
          {
            variantId: 11,
            sku: "SKU-11",
            price: "12.50",
            stockStatus: "IN_STOCK",
            attributes: [],
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Added to cart.");
    expect(JSON.parse(window.localStorage.getItem(GUEST_CART_KEY) ?? "[]")).toEqual([
      { variantId: 11, productId: 7, quantity: 1 },
    ]);
    expect(window.localStorage.getItem(GUEST_CART_KEY)).not.toMatch(/price/i);
  });
});
