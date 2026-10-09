import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api-client";
import { mergeCart } from "@/lib/api-client/cart";
import { cookieHeaderFromRequest } from "@/lib/auth/session";

interface MergeInput {
  items: { variantId: number; quantity: number }[];
}

export async function POST(request: Request) {
  let body: MergeInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: "INVALID_JSON", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
  if (
    !Array.isArray(body?.items) ||
    body.items.length > 100 ||
    body.items.some(
      (item) =>
        !Number.isInteger(item?.variantId) ||
        !Number.isInteger(item?.quantity),
    )
  ) {
    return NextResponse.json(
      { code: "INVALID_INPUT", message: "items must contain valid variantId and quantity integers." },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(
      await mergeCart(await cookieHeaderFromRequest(), body.items),
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
