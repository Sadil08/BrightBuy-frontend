"use client";

import { useActionState, useState } from "react";
import { createProductAction, type CatalogFormState } from "@/app/actions/admin-catalog";
import type { Category } from "@/lib/api-client/catalog";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { FormMessages } from "./FormMessages";
import { VariantFields } from "./VariantFields";

const initial: CatalogFormState = {};

export function ProductForm({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState(createProductAction, initial);
  const [variantKeys, setVariantKeys] = useState([0]);
  const [nextKey, setNextKey] = useState(1);

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-6">
      <section className="card flex flex-col gap-4 p-4 sm:p-6">
        <h2 className="text-xl font-extrabold">Details</h2>
        <label className="block">
          <span className="label">Name</span>
          <input name="name" required maxLength={150} className="input" />
        </label>
        <label className="block">
          <span className="label">Description</span>
          <textarea name="description" rows={4} className="input" />
        </label>
        <fieldset>
          <legend className="label">Categories</legend>
          {categories.length === 0 ? (
            <p className="hint">No categories yet — create one first.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <label key={category.categoryId} className="chip cursor-pointer has-[:checked]:bg-action-soft has-[:checked]:text-action">
                  <input type="checkbox" name="categoryIds" value={category.categoryId} className="sr-only" />
                  {category.name}
                </label>
              ))}
            </div>
          )}
        </fieldset>
      </section>

      <section className="card flex flex-col gap-4 p-4 sm:p-6">
        <h2 className="text-xl font-extrabold">Variants</h2>
        {variantKeys.map((key, i) => (
          <div key={key} className="flex flex-col gap-2">
            <VariantFields index={i} />
            {variantKeys.length > 1 && (
              <button type="button" className="btn btn-ghost btn-sm self-end" onClick={() => setVariantKeys((keys) => keys.filter((k) => k !== key))}>
                <TrashIcon /> Remove variant {i + 1}
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-outline btn-sm self-start" onClick={() => { setVariantKeys((keys) => [...keys, nextKey]); setNextKey(nextKey + 1); }}>
          <PlusIcon /> Add another variant
        </button>
      </section>

      <FormMessages state={state} />
      <button type="submit" className="btn btn-primary btn-lg self-start" disabled={pending}>{pending ? "Creating…" : "Create product"}</button>
    </form>
  );
}
