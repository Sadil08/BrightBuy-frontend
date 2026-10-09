import { NextResponse } from "next/server";
import { placeOrder, type CheckoutRequest } from "@/lib/api-client/orders";
import { badRequest, errorResponse, readJson } from "@/lib/api-client/route-helpers";
import { cookieHeaderFromRequest } from "@/lib/auth/session";

// The browser calls this; this calls the backend with the caller's session cookie. The
// Idempotency-Key header is forwarded untouched: the CLIENT owns it (generated once per checkout
// attempt, reused on a retry) so a double-click or a network retry can never create a second order.
export async function POST(request: Request) {
  const key = request.headers.get("Idempotency-Key");
  if (!key || key.length > 64) return badRequest("An Idempotency-Key header (max 64 characters) is required.");
  const body = await readJson(request);
  if (!body) return badRequest("Request body must be a JSON object.");
  try {
    const order = await placeOrder(await cookieHeaderFromRequest(), key, body as unknown as CheckoutRequest);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
