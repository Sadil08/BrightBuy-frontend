// Declarative description of the five reports. The page and the CSV route both read this list, so a
// new report is one entry here (+ one typed fetcher in api-client/reports.ts) — no page edits.
import {
  getCategoryWiseOrders,
  getCustomerOrderSummary,
  getQuarterlySales,
  getTopSellingProducts,
  getUpcomingDeliveries,
  type ReportParams,
} from "@/lib/api-client/reports";
import { formatUsd } from "@/lib/money";

export type FilterKind = "year" | "dateRange" | "customerId";

export interface Column {
  header: string;
  align?: "right";
  cell: (row: Record<string, unknown>) => string;
}

export interface LoadedReport {
  rows: Record<string, unknown>[];
  note?: string;
  range?: string;
}

export interface ReportDefinition {
  key: string;
  title: string;
  blurb: string;
  backendPath: string; // path segment under /reports (used by the CSV proxy)
  filters: FilterKind[];
  columns: Column[];
  load: (cookieHeader: string, params: ReportParams) => Promise<LoadedReport>;
}

const text = (key: string) => (row: Record<string, unknown>) => String(row[key] ?? "");
const usd = (key: string) => (row: Record<string, unknown>) => formatUsd(String(row[key] ?? "0.00"));
const date = (key: string) => (row: Record<string, unknown>) => String(row[key] ?? "").slice(0, 10);

export function defaultYear(now = new Date()): string {
  return String(now.getFullYear());
}

export const REPORTS: readonly ReportDefinition[] = [
  {
    key: "quarterly-sales",
    title: "Quarterly sales",
    blurb: "Sales value per quarter, excluding tax and delivery fees. Cancelled orders are left out.",
    backendPath: "quarterly-sales",
    filters: ["year"],
    columns: [
      { header: "Year", cell: text("year") },
      { header: "Quarter", cell: (r) => `Q${r.quarter}` },
      { header: "Sales", align: "right", cell: usd("salesValue") },
    ],
    load: async (c, p) => ({ rows: (await getQuarterlySales(c, { year: p.year ?? defaultYear() })) as unknown as Record<string, unknown>[] }),
  },
  {
    key: "top-selling-products",
    title: "Top-selling products",
    blurb: "Products ranked by units sold. Leave the dates empty for all time.",
    backendPath: "top-selling-products",
    filters: ["dateRange"],
    columns: [
      { header: "Product", cell: text("productName") },
      { header: "Units sold", align: "right", cell: text("quantitySold") },
      { header: "Revenue", align: "right", cell: usd("revenue") },
    ],
    load: async (c, p) => {
      const report = await getTopSellingProducts(c, { from: p.from, to: p.to });
      return { rows: report.products as unknown as Record<string, unknown>[], range: report.from ? `${report.from.slice(0, 10)} to ${report.to?.slice(0, 10) ?? "…"}` : "All time" };
    },
  },
  {
    key: "category-wise-orders",
    title: "Orders by category",
    blurb: "How many orders include each category.",
    backendPath: "category-wise-orders",
    filters: ["dateRange"],
    columns: [
      { header: "Category", cell: text("name") },
      { header: "Orders", align: "right", cell: text("orderCount") },
    ],
    load: async (c, p) => {
      const report = await getCategoryWiseOrders(c, { from: p.from, to: p.to });
      return { rows: report.categories as unknown as Record<string, unknown>[], note: report.note };
    },
  },
  {
    key: "upcoming-deliveries",
    title: "Upcoming deliveries",
    blurb: "Orders not yet fulfilled, soonest first.",
    backendPath: "upcoming-deliveries",
    filters: [],
    columns: [
      { header: "Order", cell: (r) => `#${r.orderId}` },
      { header: "Customer", cell: text("customerName") },
      { header: "Mode", cell: text("deliveryMode") },
      { header: "Estimated", cell: date("estimatedDate") },
      { header: "Status", cell: text("orderStatus") },
    ],
    load: async (c) => ({ rows: (await getUpcomingDeliveries(c)) as unknown as Record<string, unknown>[] }),
  },
  {
    key: "customer-order-summary",
    title: "Customer orders & payments",
    blurb: "Each order with its payment status. Filter by customer id and/or date.",
    backendPath: "customer-order-summary",
    filters: ["customerId", "dateRange"],
    columns: [
      { header: "Customer", cell: text("customerName") },
      { header: "Order", cell: (r) => `#${r.orderId}` },
      { header: "Date", cell: date("orderDate") },
      { header: "Status", cell: text("orderStatus") },
      { header: "Payment", cell: (r) => `${r.paymentMethod} · ${r.paymentStatus}` },
      { header: "Sales", align: "right", cell: usd("salesValue") },
    ],
    load: async (c, p) => ({ rows: (await getCustomerOrderSummary(c, { customerId: p.customerId, from: p.from, to: p.to })) as unknown as Record<string, unknown>[] }),
  },
];

export function findReport(key: string | undefined): ReportDefinition {
  return REPORTS.find((r) => r.key === key) ?? REPORTS[0];
}

/** Only the filter params a report declares are ever forwarded — nothing arbitrary reaches the backend. */
export function allowedParams(report: ReportDefinition, raw: Record<string, string | undefined>): ReportParams {
  const out: ReportParams = {};
  if (report.filters.includes("year")) out.year = raw.year;
  if (report.filters.includes("dateRange")) { out.from = raw.from; out.to = raw.to; }
  if (report.filters.includes("customerId")) out.customerId = raw.customerId;
  return out;
}
