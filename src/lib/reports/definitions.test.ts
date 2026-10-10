import { describe, expect, it } from "vitest";
import { allowedParams, findReport, REPORTS } from "./definitions";

describe("report definitions", () => {
  it("has the five reports the SRS requires (REQ-9.1–9.5)", () => {
    expect(REPORTS.map((r) => r.key)).toEqual([
      "quarterly-sales", "top-selling-products", "category-wise-orders", "upcoming-deliveries", "customer-order-summary",
    ]);
  });

  it("only forwards the filters a report declares", () => {
    const quarterly = findReport("quarterly-sales");
    expect(allowedParams(quarterly, { year: "2026", from: "2026-01-01", customerId: "9", evil: "x" })).toEqual({ year: "2026" });
    const customers = findReport("customer-order-summary");
    expect(allowedParams(customers, { customerId: "9", from: "2026-01-01", to: "2026-02-01", year: "2026" })).toEqual({ customerId: "9", from: "2026-01-01", to: "2026-02-01" });
  });

  it("falls back to the first report for an unknown key", () => {
    expect(findReport("nope").key).toBe("quarterly-sales");
  });

  it("formats money columns for display", () => {
    const sales = findReport("quarterly-sales").columns.find((c) => c.header === "Sales")!;
    expect(sales.cell({ salesValue: "1234.50" })).toBe("$1,234.50");
  });
});
