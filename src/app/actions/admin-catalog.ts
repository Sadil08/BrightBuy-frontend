"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import * as catalog from "@/lib/api-client/admin-catalog";
import { parseAttributes, parsePrice } from "@/lib/catalog/parse";
import { withSilentRefresh } from "@/lib/auth/with-silent-refresh";

export interface CatalogFormState {
  error?: string;
  success?: string;
}

const MESSAGES: Record<string, string> = {
  SKU_CONFLICT: "That SKU is already used by another variant.",
  CATEGORY_INVALID: "One of the selected categories is missing or inactive.",
  NOT_FOUND: "That item no longer exists.",
  FORBIDDEN: "Your role isn't allowed to do that.",
};

function fail(err: unknown): CatalogFormState {
  if (err instanceof ApiError) return { error: MESSAGES[err.code] ?? err.message };
  throw err;
}

const str = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const id = (formData: FormData, key: string) => Number(formData.get(key));

function refreshCatalog(productId?: number) {
  revalidatePath("/admin/catalog");
  if (productId) revalidatePath(`/admin/catalog/${productId}`);
  revalidatePath("/products");
}

// Reads the repeated `variantSku` / `variantPrice` / `variantStock` / `variantAttrs` fields the
// product form renders once per variant row (same index = same variant).
function readVariants(formData: FormData): catalog.VariantInput[] | string {
  const skus = formData.getAll("variantSku").map(String);
  const prices = formData.getAll("variantPrice").map(String);
  const stocks = formData.getAll("variantStock").map(String);
  const attrs = formData.getAll("variantAttrs").map(String);
  const variants: catalog.VariantInput[] = [];
  for (let i = 0; i < skus.length; i++) {
    const sku = skus[i].trim();
    const price = parsePrice(prices[i] ?? "");
    const stock = Number(stocks[i] ?? "0");
    const attributes = parseAttributes(attrs[i] ?? "");
    if (!sku) return `Variant ${i + 1}: SKU is required.`;
    if (!price) return `Variant ${i + 1}: enter a price like 49.99.`;
    if (!Number.isInteger(stock) || stock < 0) return `Variant ${i + 1}: opening stock must be a whole number, 0 or more.`;
    if (!attributes) return `Variant ${i + 1}: attributes look like "Colour=Black, Size=M".`;
    variants.push({ sku, price, openingStock: stock, attributes });
  }
  return variants;
}

export async function createProductAction(_prev: CatalogFormState, formData: FormData): Promise<CatalogFormState> {
  const name = str(formData, "name");
  const categoryIds = formData.getAll("categoryIds").map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (!name) return { error: "Give the product a name." };
  if (categoryIds.length === 0) return { error: "Choose at least one category." };
  const variants = readVariants(formData);
  if (typeof variants === "string") return { error: variants };
  if (variants.length === 0) return { error: "Add at least one variant." };

  let productId: number;
  try {
    productId = (await withSilentRefresh((c) => catalog.createProduct(c, { name, description: str(formData, "description"), categoryIds, variants }))).productId;
  } catch (err) {
    return fail(err);
  }
  refreshCatalog();
  redirect(`/admin/catalog/${productId}?created=1`);
}

export async function updateProductAction(_prev: CatalogFormState, formData: FormData): Promise<CatalogFormState> {
  const productId = id(formData, "productId");
  const name = str(formData, "name");
  if (!name) return { error: "The name can't be empty." };
  try {
    await withSilentRefresh((c) => catalog.updateProduct(c, productId, { name, description: str(formData, "description") }));
  } catch (err) {
    return fail(err);
  }
  refreshCatalog(productId);
  return { success: "Product saved." };
}

export async function deactivateProductAction(formData: FormData): Promise<void> {
  const productId = id(formData, "productId");
  await withSilentRefresh((c) => catalog.deactivateProduct(c, productId));
  refreshCatalog(productId);
  redirect("/admin/catalog");
}

export async function addVariantAction(_prev: CatalogFormState, formData: FormData): Promise<CatalogFormState> {
  const productId = id(formData, "productId");
  const variants = readVariants(formData);
  if (typeof variants === "string") return { error: variants };
  if (variants.length !== 1) return { error: "Fill in the variant details." };
  try {
    await withSilentRefresh((c) => catalog.createVariant(c, productId, variants[0]));
  } catch (err) {
    return fail(err);
  }
  refreshCatalog(productId);
  return { success: "Variant added." };
}

export async function updateVariantPriceAction(_prev: CatalogFormState, formData: FormData): Promise<CatalogFormState> {
  const productId = id(formData, "productId");
  const price = parsePrice(str(formData, "price"));
  if (!price) return { error: "Enter a price like 49.99." };
  try {
    await withSilentRefresh((c) => catalog.updateVariantPrice(c, productId, id(formData, "variantId"), price));
  } catch (err) {
    return fail(err);
  }
  refreshCatalog(productId);
  return { success: "Price saved. It applies to future orders only." };
}

export async function deactivateVariantAction(formData: FormData): Promise<void> {
  const productId = id(formData, "productId");
  await withSilentRefresh((c) => catalog.deactivateVariant(c, productId, id(formData, "variantId")));
  refreshCatalog(productId);
}

export async function createCategoryAction(_prev: CatalogFormState, formData: FormData): Promise<CatalogFormState> {
  const name = str(formData, "name");
  if (!name) return { error: "Give the category a name." };
  try {
    await withSilentRefresh((c) => catalog.createCategory(c, { name, description: str(formData, "description") }));
  } catch (err) {
    return fail(err);
  }
  revalidatePath("/admin/catalog/categories");
  revalidatePath("/products");
  return { success: "Category created." };
}

export async function updateCategoryAction(_prev: CatalogFormState, formData: FormData): Promise<CatalogFormState> {
  const name = str(formData, "name");
  if (!name) return { error: "The name can't be empty." };
  try {
    await withSilentRefresh((c) => catalog.updateCategory(c, id(formData, "categoryId"), { name, description: str(formData, "description") }));
  } catch (err) {
    return fail(err);
  }
  revalidatePath("/admin/catalog/categories");
  revalidatePath("/products");
  return { success: "Saved." };
}

export async function deactivateCategoryAction(formData: FormData): Promise<void> {
  await withSilentRefresh((c) => catalog.deactivateCategory(c, id(formData, "categoryId")));
  revalidatePath("/admin/catalog/categories");
  revalidatePath("/products");
}

// ---- images: the browser uploads straight to object storage between these two calls ----

export async function requestImageUploadAction(productId: number, contentType: string): Promise<{ uploadUrl: string; objectKey: string } | { error: string }> {
  try {
    const { uploadUrl, objectKey } = await withSilentRefresh((c) => catalog.requestImageUploadUrl(c, productId, contentType));
    return { uploadUrl, objectKey };
  } catch (err) {
    return fail(err) as { error: string };
  }
}

export async function confirmImageAction(productId: number, objectKey: string, contentType: string): Promise<CatalogFormState> {
  try {
    await withSilentRefresh((c) => catalog.confirmImageUpload(c, productId, objectKey, contentType));
  } catch (err) {
    if (err instanceof ApiError && err.status === 400) return { error: "That file isn't a valid image (or doesn't match its type)." };
    return fail(err);
  }
  refreshCatalog(productId);
  return { success: "Image uploaded." };
}

export async function deleteImageAction(formData: FormData): Promise<void> {
  const productId = id(formData, "productId");
  await withSilentRefresh((c) => catalog.deleteImage(c, productId, id(formData, "imageId")));
  refreshCatalog(productId);
}
