import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartMergeSync } from "./CartMergeSync";

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("CartMergeSync", () => {
  it("merges only variant and quantity once, then clears the guest cart", async () => {
    window.localStorage.setItem(
      "brightbuy.guestCart.v1",
      JSON.stringify([{ variantId: 11, productId: 1, quantity: 2 }]),
    );
    const fetchMock = vi.spyOn(window, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ cartId: 1, items: [], subtotal: "0.00" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<CartMergeSync isCustomer />);

    await waitFor(() => {
      expect(window.localStorage.getItem("brightbuy.guestCart.v1")).toBeNull();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      items: [{ variantId: 11, quantity: 2 }],
    });
  });
});
