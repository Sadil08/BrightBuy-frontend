import type { LoadedReport, ReportDefinition } from "@/lib/reports/definitions";

// Generic renderer: whatever columns a definition declares. Wide reports scroll sideways inside
// .table-wrap on phones instead of breaking the page layout.
export function ReportTable({ report, loaded }: { report: ReportDefinition; loaded: LoadedReport }) {
  const { rows, note, range } = loaded;
  return (
    <div className="mt-6">
      {range && <p className="num mb-3 text-sm font-semibold text-ink-soft">Range: {range}</p>}
      {rows.length === 0 ? (
        <p className="card-flat px-4 py-10 text-center text-ink-soft">No data for these filters.</p>
      ) : (
        <div className="table-wrap card-flat">
          <table className="table">
            <thead>
              <tr>{report.columns.map((c) => <th key={c.header} className={c.align === "right" ? "text-right" : undefined}>{c.header}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {report.columns.map((c) => <td key={c.header} className={c.align === "right" ? "num text-right" : undefined}>{c.cell(row)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {note && <p className="alert alert-info mt-4 text-sm">{note}</p>}
    </div>
  );
}
