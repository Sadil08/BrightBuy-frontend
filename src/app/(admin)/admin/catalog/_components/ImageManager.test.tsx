import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const requestUpload = vi.fn();
const confirm = vi.fn();
vi.mock("@/app/actions/admin-catalog", () => ({
  requestImageUploadAction: (...a: unknown[]) => requestUpload(...a),
  confirmImageAction: (...a: unknown[]) => confirm(...a),
  deleteImageAction: vi.fn(),
}));

import { ImageManager } from "./ImageManager";

function pick(file: File) {
  fireEvent.change(screen.getByLabelText("Add an image"), { target: { files: [file] } });
}

beforeEach(() => {
  vi.restoreAllMocks();
  refresh.mockClear();
  requestUpload.mockReset();
  confirm.mockReset();
});

describe("ImageManager", () => {
  it("rejects non-image types before contacting the server", () => {
    render(<ImageManager productId={1} images={[]} />);
    pick(new File(["x"], "a.gif", { type: "image/gif" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/JPEG, PNG or WebP/);
    expect(requestUpload).not.toHaveBeenCalled();
  });

  it("runs presign → direct PUT → confirm, then refreshes (AC-ADMINCATALOG-6)", async () => {
    requestUpload.mockResolvedValue({ uploadUrl: "http://storage/put", objectKey: "products/1/abc" });
    confirm.mockResolvedValue({ success: "Image uploaded." });
    const put = vi.spyOn(window, "fetch").mockResolvedValue(new Response(null, { status: 200 }));

    render(<ImageManager productId={1} images={[]} />);
    pick(new File(["x"], "a.png", { type: "image/png" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(requestUpload).toHaveBeenCalledWith(1, "image/png");
    expect(put).toHaveBeenCalledWith("http://storage/put", expect.objectContaining({ method: "PUT" }));
    expect(confirm).toHaveBeenCalledWith(1, "products/1/abc", "image/png");
  });

  it("shows the backend's refusal when the bytes aren't a real image", async () => {
    requestUpload.mockResolvedValue({ uploadUrl: "http://storage/put", objectKey: "k" });
    confirm.mockResolvedValue({ error: "That file isn't a valid image (or doesn't match its type)." });
    vi.spyOn(window, "fetch").mockResolvedValue(new Response(null, { status: 200 }));

    render(<ImageManager productId={1} images={[]} />);
    pick(new File(["x"], "a.png", { type: "image/png" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/isn't a valid image/);
    expect(refresh).not.toHaveBeenCalled();
  });
});
