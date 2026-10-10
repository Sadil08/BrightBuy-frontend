import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ imageId: string }> };

// Product images live in a PRIVATE bucket (a public one costs money on some providers), so the browser
// can never load them from storage directly. It asks this same-origin route, which asks the backend
// (which holds the storage credentials) and streams the bytes back. BACKEND_URL stays server-only.
// Images never change once uploaded, so they are cached hard by the browser and Vercel's CDN.
export async function GET(_request: Request, context: RouteContext) {
  const imageId = Number((await context.params).imageId);
  if (!Number.isInteger(imageId) || imageId <= 0) return new NextResponse(null, { status: 404 });

  const backend = process.env.BACKEND_URL ?? "http://localhost:8080";
  const upstream = await fetch(`${backend}/api/v1/images/${imageId}`, { cache: "no-store" });
  if (!upstream.ok) return new NextResponse(null, { status: upstream.status === 404 ? 404 : 502 });

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
      "Cache-Control": "public, max-age=86400, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
