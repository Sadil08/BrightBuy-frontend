const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/healthz`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return Response.json({ status: "unhealthy" }, { status: 503 });
    }

    return Response.json({ status: "ok", backend: "reachable" });
  } catch {
    return Response.json(
      { status: "unhealthy", backend: "unreachable" },
      { status: 503 },
    );
  }
}