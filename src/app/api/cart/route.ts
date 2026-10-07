import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api-client";
import { getCart } from "@/lib/api-client/cart";
import { cookieHeaderFromRequest } from "@/lib/auth/session";

export async function GET() {
  try {
    return NextResponse.json(await getCart(await cookieHeaderFromRequest()));
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
