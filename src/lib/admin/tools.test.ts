import { describe, expect, it } from "vitest";
import { toolRoles, toolsForRole } from "./tools";

describe("admin tool registry", () => {
  it("gives each role exactly its tools (RBAC-1 defaults)", () => {
    expect(toolsForRole("WAREHOUSE_STAFF").map((t) => t.href)).toEqual(["/admin/catalog", "/admin/inventory"]);
    expect(toolsForRole("ORDER_MANAGER").map((t) => t.href)).toEqual(["/admin/orders"]);
    expect(toolsForRole("MANAGER").map((t) => t.href)).toEqual(["/admin/reports"]);
    expect(toolsForRole("ADMIN")).toHaveLength(6);
    expect(toolsForRole("CUSTOMER")).toEqual([]);
  });

  it("exposes roles per tool for the page-level gate", () => {
    expect(toolRoles("/admin/reports")).toContain("MANAGER");
    expect(toolRoles("/admin/unknown")).toEqual([]);
  });
});
