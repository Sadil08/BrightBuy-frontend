// Typed functions for 05-delivery-estimation (public endpoints, no cookie needed).
import { apiFetch } from "./index";
import type { DeliveryMode } from "./orders";

export interface City {
  cityId: number;
  name: string;
}

export interface DeliveryEstimate {
  mode: DeliveryMode;
  estimatedDate: string; // YYYY-MM-DD
  estimatedDays: number;
}

export interface EstimateRequest {
  mode: DeliveryMode;
  cityId?: number;
  items: { variantId: number; quantity: number }[];
}

// Reference data that changes rarely: let the framework cache it for a minute instead of hitting
// the database on every checkout page view.
export function getCities(): Promise<City[]> {
  return apiFetch<City[]>("/cities", { next: { revalidate: 60 } });
}

export function estimateDelivery(body: EstimateRequest): Promise<DeliveryEstimate> {
  return apiFetch<DeliveryEstimate>("/delivery/estimate", {
    method: "POST",
    body: JSON.stringify(body),
    cache: "no-store",
  });
}
