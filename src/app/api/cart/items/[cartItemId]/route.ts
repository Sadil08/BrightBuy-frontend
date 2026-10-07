import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api-client";
import { removeCartItem, updateCartItem } from "@/lib/api-client/cart";
import { cookieHeaderFromRequest } from "@/lib/auth/session";

type RouteContext = { params: Promise<{ cartItemId: string }> };

function parseCartItemId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const id = parseCartItemId((await context.params).cartItemId);
  if (id === null) {
    return NextResponse.json(
      { code: "INVALID_ID", message: "cartItemId must be a positive integer." },
      { status: 400 },
    );
  }
  let body: { quantity?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: "INVALID_JSON", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
  const quantity = body?.quantity;
  if (typeof quantity !== "number" || !Number.isInteger(quantity)) {
    return NextResponse.json(
      { code: "INVALID_INPUT", message: "quantity must be an integer." },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(
      await updateCartItem(await cookieHeaderFromRequest(), id, quantity),
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status },
      );
    }
    throw error;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const id = parseCartItemId((await context.params).cartItemId);
  if (id === null) {
    return NextResponse.json(
      { code: "INVALID_ID", message: "cartItemId must be a positive integer." },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(
      await removeCartItem(await cookieHeaderFromRequest(), id),
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status },
      );
    }
    throw error;
  }
}
