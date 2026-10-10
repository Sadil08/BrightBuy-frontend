import type { CatalogFormState } from "@/app/actions/admin-catalog";

export function FormMessages({ state }: { state: CatalogFormState }) {
  return (
    <>
      {state.error && <p role="alert" className="alert alert-bad">{state.error}</p>}
      {state.success && <p role="status" className="alert alert-good">{state.success}</p>}
    </>
  );
}
