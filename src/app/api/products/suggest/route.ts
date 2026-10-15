import { NextResponse } from "next/server";
import { getProducts } from "@/lib/api-client/catalog";

// Typeahead for the search bars: the first few products matching ?q=, trimmed to what a dropdown needs.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ items: [] });
  try {
    const { items } = await getProducts({ q, size: 6 });
    return NextResponse.json({
      items: items.map((p) => ({ productId: p.productId, name: p.name, priceFrom: p.priceFrom })),
    });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
