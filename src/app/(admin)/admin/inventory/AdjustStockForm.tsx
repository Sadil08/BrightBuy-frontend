"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MinusIcon, PlusIcon } from "@/components/icons";

// Adjusting stock for one variant (FR-INVENTORY-2/3). The row's current quantity is shown and the
// RESULT of the typed change is previewed live, so a typo is obvious before it is sent. A change that
// would go below zero is blocked here for convenience, but the real guarantee is server-side: the
// database procedure rejects it and a trigger backs that up (REQ-5.6).
export function AdjustStockForm({ variantId, sku, current }: { variantId: number; sku: string; current: number }) {
  const router = useRouter();
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const parsed = delta.trim() === "" ? null : Number(delta);
  const valid = parsed !== null && Number.isInteger(parsed);
  const next = valid ? current + (parsed as number) : null;
  const wouldGoNegative = next !== null && next < 0;
  const canSubmit = valid && !wouldGoNegative && reason.trim() !== "" && !pending;

  function bump(by: number) {
    setDelta(String((valid ? (parsed as number) : 0) + by));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    setError(null);
    setDone(null);
    try {
      const response = await fetch(`/api/staff/variants/${variantId}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta: parsed, reason: reason.trim() }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { code?: string; message?: string };
        setError(
          body.code === "ADJUSTMENT_BELOW_ZERO"
            ? "That would take stock below zero. Nothing was changed."
            : body.code === "FORBIDDEN"
              ? "Your role isn't allowed to adjust stock."
              : (body.message ?? "Could not adjust stock."),
        );
        return;
      }
      setDone(`Stock for ${sku} is now ${next}.`);
      setDelta("");
      setReason("");
      router.refresh(); // re-run the server component so the table shows the new quantity
    } catch {
      setError("Could not reach the server. Nothing was changed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" aria-label={`Adjust stock for ${sku}`}>
      <div>
        <label htmlFor={`delta-${variantId}`} className="label">Change (use a minus to remove)</label>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm !px-2.5" aria-label="Subtract 1" onClick={() => bump(-1)}><MinusIcon /></button>
          <input
            id={`delta-${variantId}`}
            inputMode="numeric"
            className="input num !w-28 text-center"
            placeholder="+20"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            aria-invalid={delta !== "" && !valid}
          />
          <button type="button" className="btn btn-outline btn-sm !px-2.5" aria-label="Add 1" onClick={() => bump(1)}><PlusIcon /></button>
          {[10, 50].map((n) => (
            <button key={n} type="button" className="chip !px-3 !py-1" onClick={() => bump(n)}>+{n}</button>
          ))}
        </div>
        <p className={`hint num ${wouldGoNegative ? "!text-bad font-semibold" : ""}`} aria-live="polite">
          {delta !== "" && !valid
            ? "Enter a whole number."
            : next === null
              ? `Currently ${current}.`
              : wouldGoNegative
                ? `${current} ${parsed} would be ${next}. Stock can't go below zero.`
                : `${current} → ${next}`}
        </p>
      </div>

      <div>
        <label htmlFor={`reason-${variantId}`} className="label">Reason (recorded in the audit log)</label>
        <input
          id={`reason-${variantId}`}
          className="input"
          maxLength={255}
          placeholder="e.g. Supplier delivery, recount, damaged"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      {error && <p role="alert" className="alert alert-bad">{error}</p>}
      {done && <p role="status" className="alert alert-good">{done}</p>}

      <button type="submit" className="btn btn-primary self-start" disabled={!canSubmit}>
        {pending ? "Saving…" : "Record change"}
      </button>
    </form>
  );
}
