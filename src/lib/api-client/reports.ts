// 09-management-reporting — the five read-only reports behind `reports:view`. Types mirror the Go
// structs in internal/reporting/app/report.go (the openapi `reports` paths return `200 ok` without a
// schema, so the backend's JSON is the contract here). Money is a decimal string, as everywhere.
import { apiFetch } from "./index";
import type { Money } from "./catalog";

export interface QuarterlySalesRow { year: number; quarter: number; salesValue: Money }
export interface TopSellingProductRow { productId: number; productName: string; quantitySold: number; revenue: Money }
export interface TopSellingProductsReport { from: string | null; to: string | null; products: TopSellingProductRow[] }
export interface CategoryOrderCount { categoryId: number; name: string; orderCount: number }
export interface CategoryWiseReport { categories: CategoryOrderCount[]; note: string }
export interface UpcomingDeliveryRow {
  orderId: number; customerName: string; customerEmail: string; deliveryMode: string;
  address: string; estimatedDate: string; orderStatus: string;
}
export interface CustomerOrderPaymentRow {
  customerId: number; customerName: string; customerEmail: string; orderId: number; orderDate: string;
  orderStatus: string; salesValue: Money; paymentMethod: string; paymentStatus: string; paymentAmount: Money;
}

export type ReportParams = Record<string, string | undefined>;

function queryString(params: ReportParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

function get<T>(cookieHeader: string, path: string, params: ReportParams): Promise<T> {
  return apiFetch<T>(`/reports/${path}${queryString(params)}`, { headers: { Cookie: cookieHeader }, cache: "no-store" });
}

export const getQuarterlySales = (c: string, p: { year: string }) => get<QuarterlySalesRow[]>(c, "quarterly-sales", p);
export const getTopSellingProducts = (c: string, p: { from?: string; to?: string; limit?: string }) =>
  get<TopSellingProductsReport>(c, "top-selling-products", p);
export const getCategoryWiseOrders = (c: string, p: { from?: string; to?: string }) =>
  get<CategoryWiseReport>(c, "category-wise-orders", p);
export const getUpcomingDeliveries = (c: string) => get<UpcomingDeliveryRow[]>(c, "upcoming-deliveries", {});
export const getCustomerOrderSummary = (c: string, p: { customerId?: string; from?: string; to?: string }) =>
  get<CustomerOrderPaymentRow[]>(c, "customer-order-summary", p);

/** Raw backend response for the CSV export proxy (src/app/api/staff/reports/[report]). */
export async function fetchReportCsv(cookieHeader: string, path: string, params: ReportParams): Promise<Response> {
  const backend = process.env.BACKEND_URL ?? "http://localhost:8080";
  return fetch(`${backend}/api/v1/reports/${path}${queryString({ ...params, format: "csv" })}`, {
    headers: { Cookie: cookieHeader, Accept: "text/csv" },
    cache: "no-store",
  });
}
