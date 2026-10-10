"use client";

import { useActionState } from "react";
import { updateProductAction, type CatalogFormState } from "@/app/actions/admin-catalog";
import { FormMessages } from "./FormMessages";

const initial: CatalogFormState = {};

export function EditProductForm({ productId, name, description }: { productId: number; name: string; description: string }) {
  const [state, action, pending] = useActionState(updateProductAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="productId" value={productId} />
      <label className="block">
        <span className="label">Name</span>
        <input name="name" required maxLength={150} defaultValue={name} className="input" />
      </label>
      <label className="block">
        <span className="label">Description</span>
        <textarea name="description" rows={4} defaultValue={description} className="input" />
      </label>
      <FormMessages state={state} />
      <button type="submit" className="btn btn-primary self-start" disabled={pending}>{pending ? "Saving…" : "Save details"}</button>
    </form>
  );
}
