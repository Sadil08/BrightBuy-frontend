import { NextResponse } from "next/server";
import { adjustStock } from "@/lib/api-client/inventory";
import { badRequest, errorResponse, readJson } from "@/lib/api-client/route-helpers";
import { cookieHeaderFromRequest } from "@/lib/auth/session";

type RouteContext = { params: Promise<{ variantId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const variantId = Number((await context.params).variantId);
  if (!Number.isInteger(variantId) || variantId <= 0) return badRequest("variantId must be a positive integer.");
  const body = await readJson(request);
  if (!body) return badRequest("Request body must be a JSON object.");
  const { delta, reason } = body;
  if (!Number.isInteger(delta)) return badRequest("delta must be a whole number.");
  if (typeof reason !== "string" || reason.trim() === "") return badRequest("A reason is required.");
  try {
    return NextResponse.json(
      await adjustStock(await cookieHeaderFromRequest(), variantId, { delta: delta as number, reason }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
