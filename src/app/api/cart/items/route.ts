import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api-client";
import { addCartItem } from "@/lib/api-client/cart";
import { cookieHeaderFromRequest } from "@/lib/auth/session";

interface ItemInput {
  variantId: number;
  quantity: number;
}

export async function POST(request: Request) {
  let body: ItemInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: "INVALID_JSON", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
  if (!Number.isInteger(body?.variantId) || !Number.isInteger(body?.quantity)) {
    return NextResponse.json(
      { code: "INVALID_INPUT", message: "variantId and quantity must be integers." },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(
      await addCartItem(await cookieHeaderFromRequest(), body),
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
