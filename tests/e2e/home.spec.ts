import { expect, test } from "@playwright/test";

test("muestra la portada de BarOps", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("BarOps");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Tu operación, en un solo lugar.",
  );
});
