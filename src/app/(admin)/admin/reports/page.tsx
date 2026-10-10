import type { Metadata } from "next";
import Link from "next/link";
import { ApiError } from "@/lib/api-client";
import { cookieHeaderFromRequest, requireToolAccess } from "@/lib/auth/session";
import { allowedParams, defaultYear, findReport, REPORTS } from "@/lib/reports/definitions";
import { DownloadIcon } from "@/components/icons";
import { ReportFilters } from "./ReportFilters";
import { ReportTable } from "./ReportTable";

export const metadata: Metadata = { title: "Reports" };

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireToolAccess("/admin/reports");
  const raw = await searchParams;
  const report = findReport(raw.report);
  const params = allowedParams(report, report.filters.includes("year") ? { ...raw, year: raw.year ?? defaultYear() } : raw);

  let loaded;
  let error: string | null = null;
  try {
    loaded = await report.load(await cookieHeaderFromRequest(), params);
  } catch (err) {
    if (!(err instanceof ApiError)) throw err;
    error = err.status === 403 ? "Your role doesn't have permission to view reports. Ask an administrator to grant reports:view." : err.message;
  }

  const csvQuery = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <main className="p-4 sm:p-10">
      <p className="eyebrow">Management</p>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Reports</h1>

      <nav aria-label="Reports" className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {REPORTS.map((r) => (
          <Link key={r.key} href={`/admin/reports?report=${r.key}`} className="chip whitespace-nowrap no-underline" aria-current={r.key === report.key}>
            {r.title}
          </Link>
        ))}
      </nav>

      <section className="card mt-6 p-4 sm:p-6" aria-labelledby="report-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 max-w-2xl">
            <h2 id="report-title" className="text-2xl font-extrabold">{report.title}</h2>
            <p className="mt-1 text-sm text-ink-soft">{report.blurb}</p>
          </div>
          {!error && (
            <a href={`/api/staff/reports/${report.key}${csvQuery ? `?${csvQuery}` : ""}`} className="btn btn-outline btn-sm" download>
              <DownloadIcon /> Export CSV
            </a>
          )}
        </div>

        <ReportFilters report={report} values={params} />

        {error ? (
          <p role="alert" className="alert alert-bad mt-6">{error}</p>
        ) : (
          loaded && <ReportTable report={report} loaded={loaded} />
        )}
      </section>
    </main>
  );
}
