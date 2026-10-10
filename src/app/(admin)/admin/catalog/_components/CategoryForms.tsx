"use client";

import { useActionState } from "react";
import {
  createCategoryAction,
  deactivateCategoryAction,
  updateCategoryAction,
  type CatalogFormState,
} from "@/app/actions/admin-catalog";
import type { Category } from "@/lib/api-client/catalog";
import { TrashIcon } from "@/components/icons";
import { FormMessages } from "./FormMessages";

const initial: CatalogFormState = {};

export function NewCategoryForm() {
  const [state, action, pending] = useActionState(createCategoryAction, initial);
  return (
    <form action={action} className="card flex flex-col gap-3 p-4 sm:p-5">
      <h2 className="text-lg font-extrabold">New category</h2>
      <label className="block"><span className="label">Name</span><input name="name" required maxLength={100} className="input" /></label>
      <label className="block"><span className="label">Description</span><input name="description" className="input" /></label>
      <FormMessages state={state} />
      <button type="submit" className="btn btn-primary self-start" disabled={pending}>{pending ? "Creating…" : "Create category"}</button>
    </form>
  );
}

export function CategoryRow({ category }: { category: Category }) {
  const [state, action, pending] = useActionState(updateCategoryAction, initial);
  return (
    <li className="flex flex-col gap-2 p-4 sm:px-5">
      <form action={action} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="categoryId" value={category.categoryId} />
        <label className="block min-w-0 flex-1 basis-40"><span className="label">Name</span><input name="name" required defaultValue={category.name} className="input" /></label>
        <label className="block min-w-0 flex-1 basis-48"><span className="label">Description</span><input name="description" defaultValue={category.description} className="input" /></label>
        <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
        <button type="submit" formAction={deactivateCategoryAction} className="btn btn-ghost btn-sm" aria-label={`Deactivate ${category.name}`}><TrashIcon /> Deactivate</button>
      </form>
      <FormMessages state={state} />
    </li>
  );
}
