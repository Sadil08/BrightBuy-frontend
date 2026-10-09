import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GUEST_CART_CHANGED_EVENT, GUEST_CART_KEY, addGuestLine, clearGuestCart, loadGuestCart,
  removeGuestLine, saveGuestCart, toMergePayload, updateGuestLineQuantity,
} from "./guest-cart";
import { MAX_LINE_QUANTITY } from "./types";

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("guest cart storage", () => {
  it("starts empty", () => expect(loadGuestCart()).toEqual([]));

  it("round-trips an added line", () => {
    addGuestLine({ variantId: 10, productId: 1, quantity: 2 });
    expect(loadGuestCart()).toEqual([{ variantId: 10, productId: 1, quantity: 2 }]);
  });

  it("defaults quantity to 1 and sums repeat adds", () => {
    addGuestLine({ variantId: 10, productId: 1 });
    addGuestLine({ variantId: 10, productId: 1, quantity: 2 });
    expect(loadGuestCart()).toEqual([{ variantId: 10, productId: 1, quantity: 3 }]);
  });

  it("clamps to MAX_LINE_QUANTITY", () => {
    addGuestLine({ variantId: 10, productId: 1, quantity: MAX_LINE_QUANTITY });
    addGuestLine({ variantId: 10, productId: 1, quantity: 5 });
    expect(loadGuestCart()[0].quantity).toBe(MAX_LINE_QUANTITY);
  });

  it("ignores invalid adds", () => {
    addGuestLine({ variantId: 10, productId: 1, quantity: 0 });
    addGuestLine({ variantId: 10, productId: 1, quantity: 1.5 });
    expect(loadGuestCart()).toEqual([]);
  });

  it("never persists a price", () => {
    addGuestLine({ variantId: 10, productId: 1, quantity: 1, price: 0.01 } as never);
    expect(window.localStorage.getItem(GUEST_CART_KEY)).not.toMatch(/price/i);
  });
});

describe("quantity updates", () => {
  beforeEach(() => {
    addGuestLine({ variantId: 10, productId: 1, quantity: 2 });
    addGuestLine({ variantId: 20, productId: 2, quantity: 1 });
  });

  it("sets an absolute quantity", () => {
    updateGuestLineQuantity(10, 5);
    expect(loadGuestCart().find((l) => l.variantId === 10)?.quantity).toBe(5);
  });

  it("removes the line at 0", () => {
    updateGuestLineQuantity(10, 0);
    expect(loadGuestCart().map((l) => l.variantId)).toEqual([20]);
  });

  it("ignores unknown variants and non-integers", () => {
    updateGuestLineQuantity(999, 3);
    updateGuestLineQuantity(10, 2.5);
    expect(loadGuestCart()).toHaveLength(2);
    expect(loadGuestCart()[0].quantity).toBe(2);
  });

  it("removes and clears", () => {
    removeGuestLine(10);
    expect(loadGuestCart()).toHaveLength(1);
    clearGuestCart();
    expect(window.localStorage.getItem(GUEST_CART_KEY)).toBeNull();
  });
});

describe("untrusted storage", () => {
  it("survives corrupt JSON and non-arrays", () => {
    window.localStorage.setItem(GUEST_CART_KEY, "{not json");
    expect(loadGuestCart()).toEqual([]);
    window.localStorage.setItem(GUEST_CART_KEY, '{"a":1}');
    expect(loadGuestCart()).toEqual([]);
  });

  it("drops bad entries and merges duplicates", () => {
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify([
      { variantId: 1, productId: 1, quantity: 2 },
      { variantId: 1, productId: 1, quantity: 3 },
      { variantId: "2", productId: 1, quantity: 1 },
      { variantId: 3, productId: 1, quantity: -4 },
      { variantId: 4, productId: 1, quantity: 9999 },
      null,
    ]));
    expect(loadGuestCart()).toEqual([
      { variantId: 1, productId: 1, quantity: 5 },
      { variantId: 4, productId: 1, quantity: MAX_LINE_QUANTITY },
    ]);
  });
});

describe("misc", () => {
  it("merge payload carries only variantId and quantity", () => {
    expect(toMergePayload([{ variantId: 10, productId: 1, quantity: 2 }])).toEqual([{ variantId: 10, quantity: 2 }]);
  });

  it("emits a change event on save", () => {
    const handler = vi.fn();
    window.addEventListener(GUEST_CART_CHANGED_EVENT, handler);
    saveGuestCart([]);
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(GUEST_CART_CHANGED_EVENT, handler);
  });

  it("returns false instead of throwing when storage is full", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    expect(saveGuestCart([{ variantId: 1, productId: 1, quantity: 1 }])).toBe(false);
  });
});