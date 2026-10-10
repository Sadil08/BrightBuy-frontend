// 07-admin-catalog — staff catalogue management and the two-step image upload. Field names match
// specs/openapi/openapi.yaml (camelCase; prices are decimal strings). Server-only: every call carries
// the caller's cookie, and the backend enforces `catalog:write` / `catalog:image:write`.
import { apiFetch } from "./index";
import type { Money, ProductImage } from "./catalog";
export type { ProductImage };

export interface VariantInput {
  sku: string;
  price: Money;
  openingStock: number;
  attributes?: { name: string; value: string }[];
}

export interface ProductInput {
  name: string;
  description: string;
  categoryIds: number[];
  variants: VariantInput[];
}

export interface AdminProduct {
  productId: number;
  name: string;
  description: string;
  active: boolean;
}

export interface AdminVariant {
  variantId: number;
  productId: number;
  sku: string;
  price: Money;
  active: boolean;
}

export interface AdminCategory {
  categoryId: number;
  name: string;
  description: string;
  active: boolean;
}

export interface UploadUrl {
  uploadUrl: string;
  objectKey: string;
  expiresAt: string;
}


function send<T>(cookieHeader: string, method: string, path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(`/staff${path}`, {
    method,
    headers: { Cookie: cookieHeader },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
}

export const createProduct = (c: string, input: ProductInput) => send<AdminProduct>(c, "POST", "/products", input);
export const updateProduct = (c: string, id: number, patch: { name?: string; description?: string }) =>
  send<void>(c, "PATCH", `/products/${id}`, patch);
export const deactivateProduct = (c: string, id: number) => send<void>(c, "DELETE", `/products/${id}`);

export const createVariant = (c: string, productId: number, input: VariantInput) =>
  send<AdminVariant>(c, "POST", `/products/${productId}/variants`, input);
export const updateVariantPrice = (c: string, productId: number, variantId: number, price: Money) =>
  send<void>(c, "PATCH", `/products/${productId}/variants/${variantId}`, { price });
export const deactivateVariant = (c: string, productId: number, variantId: number) =>
  send<void>(c, "DELETE", `/products/${productId}/variants/${variantId}`);

export const createCategory = (c: string, input: { name: string; description?: string }) =>
  send<AdminCategory>(c, "POST", "/categories", input);
export const updateCategory = (c: string, id: number, patch: { name?: string; description?: string }) =>
  send<void>(c, "PATCH", `/categories/${id}`, patch);
export const deactivateCategory = (c: string, id: number) => send<void>(c, "DELETE", `/categories/${id}`);

// Step 1 of the image pipeline: a presigned PUT URL for ONE server-generated object key. The browser
// then PUTs the file straight to object storage; step 2 (confirm) makes the backend re-read the object,
// check the magic bytes, strip metadata and only then record it (02_SECURITY_BASELINE.md §4).
export const requestImageUploadUrl = (c: string, productId: number, contentType: string) =>
  send<UploadUrl>(c, "POST", `/products/${productId}/images/upload-url`, { contentType });
export const confirmImageUpload = (c: string, productId: number, objectKey: string, contentType: string) =>
  send<ProductImage>(c, "POST", `/products/${productId}/images`, { objectKey, contentType });
export const deleteImage = (c: string, productId: number, imageId: number) =>
  send<void>(c, "DELETE", `/products/${productId}/images/${imageId}`);
