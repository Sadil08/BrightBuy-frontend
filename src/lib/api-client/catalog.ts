// Typed functions for the 01-catalog backend endpoints — the types here are hand-written against
// ../../../../specs/openapi/openapi.yaml's `catalog` schemas, not generated, but intentionally kept
// in exact 1:1 correspondence with it (same field names, same casing) so a mismatch is easy to spot
// in a diff. If the backend's shape ever changes, this is the one file that needs to change —
// components import these types/functions, never `fetch` the backend directly (src/lib/api-client's
// own top-of-file comment).

import { apiFetch } from "./index";

// A price is always a decimal string over the wire (e.g. "49.99"), never a JSON number — see
// brightbuy-backend's internal/shared/money package and specs/global/01_TECH_STACK.md §3.5. Money
// arithmetic/formatting on the frontend should go through one small helper (not built yet) rather
// than ad-hoc `parseFloat`, for the same float-precision reason the backend avoids it — out of scope
// for this feature today, since nothing here needs to add two prices together, only display one.
export type Money = string;

export type StockStatus = "IN_STOCK" | "OUT_OF_STOCK";

export interface Category {
  categoryId: number;
  name: string;
  description: string;
}

export interface ProductSummary {
  productId: number;
  name: string;
  priceFrom: Money;
  stockStatus: StockStatus;
}

export interface VariantAttribute {
  name: string;
  value: string;
}

export interface ProductVariant {
  variantId: number;
  sku: string;
  price: Money;
  stockStatus: StockStatus;
  attributes: VariantAttribute[];
}

export interface ProductImage {
  imageId: number;
  url: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Product {
  productId: number;
  name: string;
  description: string;
  categories: Category[];
  variants: ProductVariant[];
  // Public URLs of the uploaded images, oldest first; the first is the primary image. Empty until staff
  // upload one (07-admin-catalog) — the storefront then falls back to generated art.
  images: ProductImage[];
}

export interface Page {
  page: number;
  size: number;
  total: number;
}

export interface ProductList {
  items: ProductSummary[];
  page: Page;
}

export function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories");
}

export interface ListProductsParams {
  q?: string;
  categoryId?: number;
  page?: number;
  size?: number;
}

// Builds the query string from only the params that were actually provided — e.g. calling
// getProducts({}) hits plain "/products", not "/products?q=&categoryId=&page=&size=", so the
// backend's own defaulting (CatalogService.ListProducts -> ListFilter.Normalized()) is what decides
// page 1 / size 20, not an accidental empty string sent from here.
export function getProducts(params: ListProductsParams = {}): Promise<ProductList> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.categoryId !== undefined) query.set("categoryId", String(params.categoryId));
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));

  const queryString = query.toString();
  return apiFetch<ProductList>(`/products${queryString ? `?${queryString}` : ""}`);
}

export function getProduct(productId: number): Promise<Product> {
  return apiFetch<Product>(`/products/${productId}`);
}
