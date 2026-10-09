import { NextResponse } from "next/server";
import { estimateDelivery } from "@/lib/api-client/delivery";
import { badRequest, errorResponse, readJson } from "@/lib/api-client/route-helpers";

// Public (a guest can preview a delivery date before signing up). Browser -> this handler -> backend,
// so the backend's address stays server-side.
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return badRequest("Request body must be a JSON object.");
  const { mode, cityId, items } = body;
  if (mode !== "StorePickup" && mode !== "StandardDelivery") return badRequest("Unknown delivery mode.");
  if (mode === "StandardDelivery" && !Number.isInteger(cityId)) return badRequest("Choose a delivery city.");
  if (!Array.isArray(items)) return badRequest("items must be an array.");
  try {
    return NextResponse.json(
      await estimateDelivery({
        mode,
        cityId: mode === "StandardDelivery" ? (cityId as number) : undefined,
        items: items as { variantId: number; quantity: number }[],
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
