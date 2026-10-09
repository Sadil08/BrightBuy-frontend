import { describe, expect, it } from "vitest";
import { formatEstimateDate } from "./dates";

describe("formatEstimateDate", () => {
  it("formats a calendar date without shifting it by timezone", () => {
    // 2026-10-14 is a Wednesday. Built from parts, so a timezone behind UTC can't turn it into the 13th.
    expect(formatEstimateDate("2026-10-14")).toBe("Wed, Oct 14");
    expect(formatEstimateDate("2026-01-01")).toBe("Thu, Jan 1");
  });
});
