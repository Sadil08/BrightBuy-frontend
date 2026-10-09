import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("accepts same-site paths, with a query string", () => {
    expect(safeNext("/checkout")).toBe("/checkout");
    expect(safeNext("/orders/5?placed=1")).toBe("/orders/5?placed=1");
  });

  it("refuses anything that could leave the site (open redirect)", () => {
    for (const bad of ["//evil.com", "https://evil.com", "http://evil.com/x", "evil.com", "/\\evil.com", "javascript:alert(1)", ""]) {
      expect(safeNext(bad)).toBe("/");
    }
  });

  it("falls back to the home page for missing or non-string values", () => {
    expect(safeNext(null)).toBe("/");
    expect(safeNext(undefined)).toBe("/");
    expect(safeNext(new File([], "x"))).toBe("/");
  });
});
