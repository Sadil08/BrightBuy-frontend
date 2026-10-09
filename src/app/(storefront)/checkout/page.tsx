import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCart } from "@/lib/api-client/cart";
import { getCities } from "@/lib/api-client/delivery";
import { cookieHeaderFromRequest, requireUser } from "@/lib/auth/session";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

// Only a signed-in CUSTOMER can check out (FR-CHECKOUT-20). requireUser() is the real check (a
// verified backend call); proxy.ts only caught "no cookie at all" cheaply before getting here.
export default async function CheckoutPage() {
  const user = await requireUser();
  if (user.role !== "CUSTOMER") redirect("/");

  const [cart, cities] = await Promise.all([getCart(await cookieHeaderFromRequest()), getCities().catch(() => [])]);
  if (cart.items.length === 0) redirect("/cart");

  return <CheckoutForm cart={cart} cities={cities} customerName={user.name} />;
}
