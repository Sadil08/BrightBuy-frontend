import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/staff-orders", () => ({ updateOrderStatusAction: vi.fn() }));

import { StatusActions } from "./StatusActions";

describe("StatusActions", () => {
  it("offers only the moves the backend says are valid (AC-ORDERSTATUS-2)", () => {
    render(<StatusActions orderId={7} nextStatuses={["Processing", "Cancelled"]} />);
    expect(screen.getByRole("button", { name: "Mark processing" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark delivered/i })).not.toBeInTheDocument();
  });

  it("asks for confirmation before cancelling, because cancelling returns stock (AC-ORDERSTATUS-4)", () => {
    render(<StatusActions orderId={7} nextStatuses={["Processing", "Cancelled"]} />);
    expect(screen.queryByRole("button", { name: "Yes, cancel order" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel order…" }));
    expect(screen.getByRole("button", { name: "Yes, cancel order" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Keep order" }));
    expect(screen.queryByRole("button", { name: "Yes, cancel order" })).not.toBeInTheDocument();
  });

  it("says so when an order is in a final state (AC-ORDERSTATUS-3)", () => {
    render(<StatusActions orderId={7} nextStatuses={[]} />);
    expect(screen.getByText(/final state/i)).toBeInTheDocument();
  });
});
