import { NextResponse } from "next/server";
import { fetchReportCsv } from "@/lib/api-client/reports";
import { badRequest } from "@/lib/api-client/route-helpers";
import { cookieHeaderFromRequest } from "@/lib/auth/session";
import { allowedParams, REPORTS } from "@/lib/reports/definitions";

type RouteContext = { params: Promise<{ report: string }> };

// CSV export proxy: the browser can't talk to the backend directly (BACKEND_URL is server-only and the
// auth cookie must be forwarded), so this streams the backend's CSV through unchanged. Only declared
// filter params are forwarded, and the backend still enforces `reports:view`.
export async function GET(request: Request, context: RouteContext) {
  const { report: reportKey } = await context.params;
  const report = REPORTS.find((r) => r.key === reportKey);
  if (!report) return badRequest("Unknown report.");

  const url = new URL(request.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const backend = await fetchReportCsv(await cookieHeaderFromRequest(), report.backendPath, allowedParams(report, raw));

  if (!backend.ok) {
    const body = await backend.json().catch(() => ({ code: "UNKNOWN", message: "Could not export the report." }));
    return NextResponse.json(body, { status: backend.status });
  }
  return new NextResponse(backend.body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": backend.headers.get("Content-Disposition") ?? `attachment; filename="${report.key}.csv"`,
    },
  });
}
