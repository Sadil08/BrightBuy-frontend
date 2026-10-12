"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { confirmImageAction, deleteImageAction, requestImageUploadAction, setPrimaryImageAction } from "@/app/actions/admin-catalog";
import type { ProductImage } from "@/lib/api-client/catalog";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/catalog/parse";
import { CheckIcon, TrashIcon } from "@/components/icons";

// Three steps, matching the backend's pipeline (02_SECURITY_BASELINE.md §4): (1) ask for a presigned
// URL, (2) PUT the file straight to object storage — it never passes through the API or this app —
// (3) tell the backend it's there so it can verify the real bytes, strip metadata and record it.
// The type/size checks below are courtesy; the server re-checks everything from the bytes.
export function ImageManager({ productId, images }: { productId: number; images: ProductImage[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return setError("Choose a JPEG, PNG or WebP image.");
    if (file.size > MAX_IMAGE_BYTES) return setError("That image is over 10 MB.");

    setBusy(true);
    try {
      const target = await requestImageUploadAction(productId, file.type);
      if ("error" in target) return setError(target.error);
      const put = await fetch(target.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!put.ok) return setError("The upload to storage failed. Try again.");
      const confirmed = await confirmImageAction(productId, target.objectKey, file.type);
      if (confirmed.error) return setError(confirmed.error);
      router.refresh();
    } catch {
      setError("Could not reach the server. Nothing was saved.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {images.length === 0 ? (
        <p className="text-sm text-ink-soft">No images yet — the storefront shows generated artwork until one is uploaded.</p>
      ) : (
        <>
          <p className="text-sm text-ink-soft">
            The <strong>preview</strong> is the picture shoppers see on the home page and in the shop. Choose it with
            &ldquo;Use as preview&rdquo;.
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((image) => (
              <li key={image.imageId} className={`card-flat overflow-hidden ${image.isPrimary ? "ring-2 ring-action" : ""}`}>
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt="" className="aspect-square w-full object-cover" />
                  {image.isPrimary && (
                    <span className="badge badge-action absolute left-2 top-2 bg-surface shadow-sm">
                      <CheckIcon width="0.95em" height="0.95em" strokeWidth={2.4} /> Preview
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1 p-2">
                  {image.isPrimary ? (
                    <span className="px-1 text-xs font-semibold text-ink-soft">Shown to shoppers</span>
                  ) : (
                    <form action={setPrimaryImageAction}>
                      <input type="hidden" name="productId" value={productId} />
                      <input type="hidden" name="imageId" value={image.imageId} />
                      <button type="submit" className="btn btn-outline btn-sm">Use as preview</button>
                    </form>
                  )}
                  <form action={deleteImageAction}>
                    <input type="hidden" name="productId" value={productId} />
                    <input type="hidden" name="imageId" value={image.imageId} />
                    <button type="submit" className="btn btn-ghost btn-sm" aria-label={`Delete image ${image.imageId}`}><TrashIcon /></button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <div>
        <label htmlFor="image-file" className="label">Add an image</label>
        <input
          ref={input}
          id="image-file"
          type="file"
          accept={IMAGE_TYPES.join(",")}
          disabled={busy}
          onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); }}
          className="input"
        />
        <p className="hint">JPEG, PNG or WebP, up to 10 MB. {busy && "Uploading…"}</p>
      </div>
      {error && <p role="alert" className="alert alert-bad">{error}</p>}
    </div>
  );
}
