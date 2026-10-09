import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api-client";
import { getProduct } from "@/lib/api-client/catalog";

export async function GET(
  _request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const productId = Number((await context.params).productId);
  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json(
      { code: "INVALID_ID", message: "productId must be a positive integer." },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(await getProduct(productId));
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
