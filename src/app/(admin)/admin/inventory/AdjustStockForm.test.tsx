import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

import { AdjustStockForm } from "./AdjustStockForm";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  refresh.mockClear();
  vi.restoreAllMocks();
});

function setup(current = 3) {
  render(<AdjustStockForm variantId={9} sku="BB-1001" current={current} />);
  const delta = screen.getByLabelText(/change/i);
  const reason = screen.getByLabelText(/reason/i);
  const submit = screen.getByRole("button", { name: "Record change" });
  return { delta, reason, submit };
}

describe("AdjustStockForm", () => {
  it("previews the result and blocks a change that would go below zero (AC-INVENTORY-3)", () => {
    const { delta, reason, submit } = setup(3);
    fireEvent.change(reason, { target: { value: "recount" } });

    fireEvent.change(delta, { target: { value: "-5" } });
    expect(screen.getByText(/can't go below zero/i)).toBeInTheDocument();
    expect(submit).toBeDisabled();

    fireEvent.change(delta, { target: { value: "-3" } }); // exactly zero is allowed
    expect(screen.getByText("3 → 0")).toBeInTheDocument();
    expect(submit).toBeEnabled();
  });

  it("needs a reason, because every change is audited (FR-INVENTORY-2)", () => {
    const { delta, submit } = setup(10);
    fireEvent.change(delta, { target: { value: "20" } });
    expect(submit).toBeDisabled();
  });

  it("rejects non-integers", () => {
    const { delta, reason, submit } = setup(10);
    fireEvent.change(reason, { target: { value: "x" } });
    fireEvent.change(delta, { target: { value: "2.5" } });
    expect(screen.getByText("Enter a whole number.")).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it("posts delta and reason, then refreshes the table (AC-INVENTORY-2)", async () => {
    const fetchMock = vi.spyOn(window, "fetch").mockResolvedValue(json(200, { status: "updated" }));
    const { delta, reason, submit } = setup(10);
    fireEvent.change(delta, { target: { value: "20" } });
    fireEvent.change(reason, { target: { value: "restock" } });
    fireEvent.click(submit);

    expect(await screen.findByRole("status")).toHaveTextContent("Stock for BB-1001 is now 30.");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/staff/variants/9/stock",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ delta: 20, reason: "restock" }) }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("explains a server-side refusal without changing anything", async () => {
    vi.spyOn(window, "fetch").mockResolvedValue(json(409, { code: "ADJUSTMENT_BELOW_ZERO", message: "x" }));
    const { delta, reason, submit } = setup(10);
    fireEvent.change(delta, { target: { value: "-1" } });
    fireEvent.change(reason, { target: { value: "r" } });
    fireEvent.click(submit);

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/below zero/i));
    expect(refresh).not.toHaveBeenCalled();
  });
});
