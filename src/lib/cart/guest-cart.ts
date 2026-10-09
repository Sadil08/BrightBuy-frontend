import { MAX_LINE_QUANTITY, type GuestCartLine, type MergeLine, type NewGuestCartLine } from "./types";

export const GUEST_CART_KEY = "brightbuy.guestCart.v1";
export const GUEST_CART_CHANGED_EVENT = "brightbuy:guest-cart-changed";

const isPositiveInt = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n > 0;
const clamp = (q: number) => Math.min(q, MAX_LINE_QUANTITY);
const hasStorage = () => typeof window !== "undefined" && !!window.localStorage;

// Drops bad entries, merges duplicate variants, clamps quantities.
function normalize(raw: unknown[]): GuestCartLine[] {
  const byVariant = new Map<number, GuestCartLine>();
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const { variantId, productId, quantity } = item as Record<string, unknown>;
    if (!isPositiveInt(variantId) || !isPositiveInt(productId) || !isPositiveInt(quantity)) continue;
    const existing = byVariant.get(variantId);
    byVariant.set(variantId, { variantId, productId, quantity: clamp((existing?.quantity ?? 0) + quantity) });
  }
  return [...byVariant.values()];
}

export function readRawGuestCart(): string {
  if (!hasStorage()) return "";
  try {
    return window.localStorage.getItem(GUEST_CART_KEY) ?? "";
  } catch {
    return "";
  }
}

export function parseGuestCart(raw: string): GuestCartLine[] {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? normalize(parsed) : [];
  } catch {
    return [];
  }
}

export const loadGuestCart = (): GuestCartLine[] => parseGuestCart(readRawGuestCart());

/** Returns false (never throws) if storage is full or blocked. */
export function saveGuestCart(lines: GuestCartLine[]): boolean {
  if (!hasStorage()) return false;
  try {
    // re-pick known fields so nothing extra (like a price) can reach storage
    const clean = lines.map(({ variantId, productId, quantity }) => ({ variantId, productId, quantity }));
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(clean));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(GUEST_CART_CHANGED_EVENT));
  return true;
}

export function addGuestLine(input: NewGuestCartLine): GuestCartLine[] {
  const current = loadGuestCart();
  const quantity = input.quantity ?? 1;
  if (!isPositiveInt(input.variantId) || !isPositiveInt(input.productId) || !isPositiveInt(quantity)) return current;
  const next = normalize([...current, { variantId: input.variantId, productId: input.productId, quantity }]);
  saveGuestCart(next);
  return next;
}

/** Absolute quantity. <= 0 removes the line. Unknown variants are ignored. */
export function updateGuestLineQuantity(variantId: number, quantity: number): GuestCartLine[] {
  const current = loadGuestCart();
  if (!Number.isInteger(quantity) || !current.some((l) => l.variantId === variantId)) return current;
  const next =
    quantity <= 0
      ? current.filter((l) => l.variantId !== variantId)
      : current.map((l) => (l.variantId === variantId ? { ...l, quantity: clamp(quantity) } : l));
  saveGuestCart(next);
  return next;
}

export function removeGuestLine(variantId: number): GuestCartLine[] {
  const next = loadGuestCart().filter((l) => l.variantId !== variantId);
  saveGuestCart(next);
  return next;
}

export function clearGuestCart(): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(GUEST_CART_CHANGED_EVENT));
}

/** Strips productId: only variantId and quantity ever leave the browser. */
export const toMergePayload = (lines: GuestCartLine[]): MergeLine[] =>
  lines.map(({ variantId, quantity }) => ({ variantId, quantity }));