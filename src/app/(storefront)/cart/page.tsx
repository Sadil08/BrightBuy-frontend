import type { Metadata } from "next";
import { getCities } from "@/lib/api-client/delivery";
import { getSession } from "@/lib/auth/session";
import { CartClient } from "./CartClient";

export const metadata: Metadata = { title: "Your cart" };

export default async function CartPage() {
  const [user, cities] = await Promise.all([getSession(), getCities().catch(() => [])]);
  return <CartClient isCustomer={user?.role === "CUSTOMER"} cities={cities} />;
}
