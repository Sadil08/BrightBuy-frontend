"use client";

import { useActionState } from "react";
import { addVariantAction, type CatalogFormState } from "@/app/actions/admin-catalog";
import { FormMessages } from "./FormMessages";
import { VariantFields } from "./VariantFields";

const initial: CatalogFormState = {};

export function AddVariantForm({ productId }: { productId: number }) {
  const [state, action, pending] = useActionState(addVariantAction, initial);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="productId" value={productId} />
      <VariantFields index={0} />
      <FormMessages state={state} />
      <button type="submit" className="btn btn-primary self-start" disabled={pending}>{pending ? "Adding…" : "Add variant"}</button>
    </form>
  );
}
