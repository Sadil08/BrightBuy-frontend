import { describe, expect, it } from "vitest";
import { parseAttributes, parsePrice } from "./parse";

describe("parsePrice", () => {
  it("normalises to two decimals", () => {
    expect(parsePrice("12")).toBe("12.00");
    expect(parsePrice(" 12.5 ")).toBe("12.50");
    expect(parsePrice("0.99")).toBe("0.99");
  });
  it("rejects anything that is not a plain non-negative amount", () => {
    for (const bad of ["", "-1", "1.234", "abc", "1,50", "1e3"]) expect(parsePrice(bad)).toBeNull();
  });
});

describe("parseAttributes", () => {
  it("parses comma separated name=value pairs", () => {
    expect(parseAttributes("Colour=Black, Size=M")).toEqual([{ name: "Colour", value: "Black" }, { name: "Size", value: "M" }]);
    expect(parseAttributes("")).toEqual([]);
  });
  it("rejects malformed pairs", () => {
    expect(parseAttributes("Colour")).toBeNull();
    expect(parseAttributes("=Black")).toBeNull();
    expect(parseAttributes("Colour=")).toBeNull();
  });
});
