import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Waits for a new tab (popup) that opens to a dynamic URL.
 * Returns the new page object for further actions.
 */
// prettier-ignore
export const waitForDynamicPage = async (page: Page): Promise<{popup: Page; newUrl: string}> => {
  const popup = await page.waitForEvent("popup");

  // Wait for minimal page load
  await popup.waitForLoadState("load", { timeout: 10000 });

  // Ensure the URL matches pattern: /md/{digits}.html
  await popup.waitForURL(/.*\/md\/\d+\.html/, { timeout: 10000 });

  // Now get the URL string
  const newUrl = popup.url();

  console.log("Dynamic Page URL:", newUrl);

  // Assert the URL pattern again for safety
  await expect(popup).toHaveURL(/.*\/md\/\d+\.html/);

  // Return the popup page for further interactions
  return {popup, newUrl};
};
