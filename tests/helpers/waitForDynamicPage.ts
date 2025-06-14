import { Page, expect } from "@playwright/test";

/**
 * Waits for a new tab (popup) that opens to a dynamic URL.
 * Returns the new page object for further actions.
 */
export async function waitForDynamicPage(page: Page): Promise<Page> {
  const popup = await page.waitForEvent("popup");

  // Wait for minimal page load
  await popup.waitForLoadState("load", { timeout: 6000 });

  // Ensure the URL matches pattern: /md/{digits}.html
  await popup.waitForURL(/.*\/md\/\d+\.html/);

  console.log("Dynamic Page URL:", popup.url());

  // Optional: Assert the URL pattern again for safety
  await expect(popup).toHaveURL(/.*\/md\/\d+\.html/);

  // Return the popup page for further interactions
  return popup;
}
