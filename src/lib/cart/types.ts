export const MAX_LINE_QUANTITY = 1000;

export interface GuestCartLine {
  variantId: number;
  productId: number; // only for GET /products/{productId}
  quantity: number;
}

export interface NewGuestCartLine {
  variantId: number;
  productId: number;
  quantity?: number; // defaults to 1
}

export interface MergeLine {
  variantId: number;
  quantity: number;
}

export interface CustomerCartItem {
  cartItemId: number;
  variantId: number;
  productName: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
  stockWarning: boolean;
  unavailable: boolean;
}

export interface CustomerCart {
  cartId: number;
  items: CustomerCartItem[];
  subtotal: string;
}

export interface CartItemInput {
  variantId: number;
  quantity: number;
}