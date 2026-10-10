import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderTimeline } from "./OrderTimeline";

const history = [
  { status: "Confirmed" as const, changedAt: "2026-10-01T10:00:00Z" },
  { status: "Processing" as const, changedAt: "2026-10-02T10:00:00Z", changedBy: "staff@brightbuy.dev" },
];

describe("OrderTimeline", () => {
  it("lists every status change in order (REQ-8.5)", () => {
    render(<OrderTimeline history={history} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Confirmed");
    expect(items[1]).toHaveTextContent("Processing");
  });

  it("shows who made a change only when the API supplied it (staff views)", () => {
    render(<OrderTimeline history={history} />);
    expect(screen.getByText(/staff@brightbuy.dev/)).toBeInTheDocument();
  });

  it("renders nothing for an empty history", () => {
    const { container } = render(<OrderTimeline history={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
