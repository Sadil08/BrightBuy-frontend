// A route handler (not a page) — lives outside both route groups, at /api/health, and returns
// JSON instead of rendering anything. This is the frontend container's own liveness check
// (mirrors the backend's /healthz, specs/global/12_DEVOPS_CICD.md §1.1) — used by
// docker-compose's healthcheck and, later, whatever orchestrator replaces it.
export async function GET() {
  return Response.json({ status: "ok" });
}
