import { getSession } from "@/lib/auth/session";
import { CartClient } from "./CartClient";

export default async function CartPage() {
  const user = await getSession();
  return <CartClient isCustomer={user?.role === "CUSTOMER"} />;
}
