export const CUSTOMER_CART_CHANGED_EVENT = "brightbuy:customer-cart-changed";

export function notifyCustomerCartChanged(): void {
  window.dispatchEvent(new Event(CUSTOMER_CART_CHANGED_EVENT));
}
