import { expect, test } from "@playwright/test";

test("guest can add, update, and remove a cart line with live subtotals", async ({ page }) => {
  await page.goto("/products/1");

  const addButton = page.getByRole("button", { name: "Add to cart" });
  await addButton.click();
  await expect(page.getByRole("status")).toContainText("Added to cart.");
  await expect(page.getByRole("link", { name: "Cart, 1 items" })).toBeVisible();

  await addButton.click();
  await expect(page.getByRole("link", { name: "Cart, 2 items" })).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByTestId("cart-subtotal")).toHaveText("$20.00");
  await page.getByRole("button", { name: "Increase quantity for Test notebook" }).click();
  await expect(page.getByTestId("cart-subtotal")).toHaveText("$30.00");

  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("Your cart is empty.")).toBeVisible();
});
