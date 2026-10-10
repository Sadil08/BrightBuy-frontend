import type { ReportParams } from "@/lib/api-client/reports";
import type { ReportDefinition } from "@/lib/reports/definitions";

// A plain GET form: filters live in the URL, so a filtered report is shareable/bookmarkable and the
// CSV export link carries exactly the same filters. No client JavaScript needed.
export function ReportFilters({ report, values }: { report: ReportDefinition; values: ReportParams }) {
  if (report.filters.length === 0) return null;
  return (
    <form method="GET" action="/admin/reports" className="mt-5 flex flex-wrap items-end gap-3 border-t border-line pt-5">
      <input type="hidden" name="report" value={report.key} />
      {report.filters.includes("year") && (
        <label className="block">
          <span className="label">Year</span>
          <input name="year" inputMode="numeric" pattern="\d{4}" defaultValue={values.year} className="input !w-28" />
        </label>
      )}
      {report.filters.includes("dateRange") && (
        <>
          <label className="block">
            <span className="label">From</span>
            <input type="date" name="from" defaultValue={values.from} className="input" />
          </label>
          <label className="block">
            <span className="label">To</span>
            <input type="date" name="to" defaultValue={values.to} className="input" />
          </label>
        </>
      )}
      {report.filters.includes("customerId") && (
        <label className="block">
          <span className="label">Customer id</span>
          <input name="customerId" inputMode="numeric" defaultValue={values.customerId} className="input !w-32" placeholder="any" />
        </label>
      )}
      <button type="submit" className="btn btn-primary">Apply</button>
    </form>
  );
}
