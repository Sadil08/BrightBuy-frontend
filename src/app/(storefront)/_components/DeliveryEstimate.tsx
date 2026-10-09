"use client";

import { useEffect, useState } from "react";
import type { City, DeliveryEstimate as Estimate } from "@/lib/api-client/delivery";
import type { DeliveryMode } from "@/lib/api-client/orders";
import { StoreIcon, TruckIcon } from "@/components/icons";
import { formatEstimateDate } from "@/lib/dates";

export interface DeliveryChoice {
  mode: DeliveryMode;
  cityId?: number;
}

export interface EstimateLine {
  variantId: number;
  quantity: number;
}

// 05-delivery-estimation's customer-facing half (FR-DELIVERY-5, REQ-6.5): show the date BEFORE the
// order is confirmed. It calls POST /delivery/estimate, which runs the very same SQL function the
// checkout procedure uses, so the date shown here is the date that gets stored on the order.
export function DeliveryEstimate({
  cities,
  items,
  value,
  onChange,
}: {
  cities: City[];
  items: EstimateLine[];
  value: DeliveryChoice;
  onChange: (next: DeliveryChoice) => void;
}) {
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A stable key so the effect re-runs only when the cart lines really change, not on every render.
  const itemsKey = JSON.stringify(items);
  const needsCity = value.mode === "StandardDelivery" && value.cityId === undefined;

  useEffect(() => {
    if (needsCity) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/delivery/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: value.mode, cityId: value.cityId, items: JSON.parse(itemsKey) }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Could not estimate delivery.");
        setEstimate((await response.json()) as Estimate);
      } catch (cause) {
        if (controller.signal.aborted) return;
        setEstimate(null);
        setError(cause instanceof Error ? cause.message : "Could not estimate delivery.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250); // small debounce so flipping through cities doesn't fire a request per keystroke
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value.mode, value.cityId, itemsKey, needsCity]);

  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="label">How would you like it?</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { mode: "StorePickup", title: "Store pickup", icon: <StoreIcon /> },
              { mode: "StandardDelivery", title: "Delivery", icon: <TruckIcon /> },
            ] as const
          ).map((option) => (
            <label
              key={option.mode}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-[1.5px] px-3.5 py-3 text-sm font-bold transition has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-action ${
                value.mode === option.mode ? "border-action bg-action-soft text-action" : "border-line-strong bg-surface hover:border-ink"
              }`}
            >
              <input
                type="radio"
                name="delivery-mode"
                className="sr-only"
                checked={value.mode === option.mode}
                onChange={() => onChange({ mode: option.mode, cityId: option.mode === "StorePickup" ? undefined : value.cityId })}
              />
              {option.icon}
              {option.title}
            </label>
          ))}
        </div>
      </fieldset>

      {value.mode === "StandardDelivery" && (
        <div>
          <label htmlFor="delivery-city" className="label">Delivery city</label>
          <select
            id="delivery-city"
            className="input"
            value={value.cityId ?? ""}
            onChange={(e) => onChange({ mode: "StandardDelivery", cityId: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">Choose a city…</option>
            {cities.map((city) => (
              <option key={city.cityId} value={city.cityId}>{city.name}</option>
            ))}
          </select>
          {cities.length === 0 && (
            <p className="hint">Delivery cities aren&apos;t available right now. Store pickup still works.</p>
          )}
        </div>
      )}

      <div aria-live="polite" className="min-h-[3.25rem]">
        {needsCity ? (
          <p className="text-sm text-ink-faint">Choose a city to see your delivery date.</p>
        ) : loading ? (
          <div className="skeleton h-12 w-full" role="status" aria-label="Estimating delivery" />
        ) : error ? (
          <p className="alert alert-warn">{error}</p>
        ) : estimate ? (
          <EstimateResult estimate={estimate} />
        ) : null}
      </div>
    </div>
  );
}

function EstimateResult({ estimate }: { estimate: Estimate }) {
  if (typeof estimate?.estimatedDate !== "string") return null;
  const pickup = estimate.mode === "StorePickup";
  const today = estimate.estimatedDays === 0;
  return (
    <div className="flex items-center gap-3 rounded-xl bg-good-soft px-4 py-3 text-good">
      <span className="text-2xl" aria-hidden="true">{pickup ? <StoreIcon /> : <TruckIcon />}</span>
      <div>
        <p className="font-display text-lg font-extrabold leading-tight">
          {today ? "Ready today" : pickup ? `Ready ${formatEstimateDate(estimate.estimatedDate)}` : `Arrives by ${formatEstimateDate(estimate.estimatedDate)}`}
        </p>
        <p className="text-xs opacity-90">
          {today
            ? "Everything is in stock. Pick up any time during opening hours."
            : `${estimate.estimatedDays} day${estimate.estimatedDays === 1 ? "" : "s"}${estimate.estimatedDays >= 8 || (pickup && estimate.estimatedDays === 3) ? " · includes 3 extra days for an out-of-stock item" : ""}`}
        </p>
      </div>
    </div>
  );
}
