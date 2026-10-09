import { describe, expect, it } from "vitest";
import { centsToMoney, formatUsd, moneyToCents, splitUsd } from "./money";

describe("money", () => {
  it("parses wire strings into integer cents", () => {
    expect(moneyToCents("49.99")).toBe(4999);
    expect(moneyToCents("0.05")).toBe(5);
    expect(moneyToCents("1200.00")).toBe(120000);
    expect(moneyToCents("-3.50")).toBe(-350);
  });

  it("rejects anything that is not a two-decimal money string", () => {
    for (const bad of ["49.9", "49", "$49.99", "1e3", "", "49.999"]) {
      expect(() => moneyToCents(bad)).toThrow();
    }
  });

  it("round-trips through cents without float drift", () => {
    expect(centsToMoney(moneyToCents("0.10") + moneyToCents("0.20"))).toBe("0.30");
    expect(centsToMoney(7)).toBe("0.07");
    expect(centsToMoney(-250)).toBe("-2.50");
  });

  it("formats for display with a symbol and thousands separators", () => {
    expect(formatUsd("1599.98")).toBe("$1,599.98");
    expect(formatUsd(159998)).toBe("$1,599.98");
    expect(formatUsd("0.00")).toBe("$0.00");
    expect(formatUsd("-12.00")).toBe("-$12.00");
  });

  it("splits dollars and cents so the cents can be styled", () => {
    expect(splitUsd("1599.98")).toEqual(["$1,599", "98"]);
  });
});
