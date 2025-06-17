import { test, expect } from "@playwright/test";
import { login } from "./helpers/login";
import { waitForDynamicPage } from "./helpers/waitForDynamicPage";
import { checkForRealAnchorInTextarea } from "./helpers/hasValidAnchorLinks";
import { checkForUrlInPlaceholders } from "./helpers/hasValidPlaceholderLinks";
import { checkPreviousMdUrlsInSameTab } from "./helpers/checkPreviousMdUrls";
import link from "../output.json";

test.setTimeout(1200000); // 20 minutes

test.describe(() => {
  // prettier-ignore
  test.skip(({ browserName }) => browserName !== "chromium", "Skipping test on non-chromium browsers");

  // prettier-ignore
  // Click on server link and redirect to monitoring users page to copy urls/domain name on multiple textareas
  test("Click to the server link and redirect to monitoring users", async ({page}) => {
    // Go to the main URL of the application
    await page.goto("http://37.27.113.240:4043/");

    // Wait until redirected to the login page URL
    await page.waitForURL("**/auth/login.html");

    // Perform login using provided credentials
    await login(page, "Houssam@enjoy.com", "Gt0572R5EM2h");

    // Wait until redirected to the send-process production page
    await page.waitForURL("**/production/send-process.html");

    // Assert that the "MTA Drops Monitor" link is visible on the page
    await expect(
      page.getByRole("link", { name: "MTA Drops Monitor" })
    ).toBeVisible();

    // Click on the "MTA Drops Monitor" link
    await page.getByRole("link", { name: "MTA Drops Monitor" }).click();

    // Wait until redirected to the MTA Drops Monitor page
    await page.waitForURL("**/production/mta-drops.html");

    // Assert that the server filter input field is visible
    await expect(page.locator("input.form-control.form-filter[name='servers']")).toBeVisible();

    // Click on the server filter input field
    await page.locator("input.form-control.form-filter[name='servers']").click();

    // Assert that the server filter input field is now focused
    await expect(page.locator("input.form-control.form-filter[name='servers']")).toBeFocused();

    // Press the "Enter" key on the keyboard
    await page.keyboard.press("Enter");

    // Wait for the loading spinner to appear and disappear
    const loading = page.locator("div.loading-message-boxed");

    await expect(loading).toBeVisible({ timeout: 10000 });

    await expect(loading).toBeHidden({ timeout: 100000 });

    // Select the second checkbox element on the page
    const secondCheckbox = page.locator("label.mt-checkbox span").nth(1);

    // Assert that the second checkbox is visible (with timeout of 1 min)
    await expect(secondCheckbox).toBeVisible({ timeout: 60000 });

    // Assert that the second checkbox is enabled
    await expect(secondCheckbox).toBeEnabled();

    // Click the second checkbox
    await secondCheckbox.click();

    // Assert that the "resend-process" button is visible
    await expect(page.locator("button.resend-process")).toBeVisible();

    // Click the resend-process button to trigger opening of a new tab
    await page.locator("button.btn.btn-outline.btn-sm.green.resend-process").click();

    // Wait for the popup page with dynamic URL to open
    const { popup, newUrl } = await waitForDynamicPage(page);

    console.log("Got new URL:", newUrl);

    // Assert that the title span with text "PRODUCTION SEND PAGE" is visible in the new page
    await expect(popup.locator("span", { hasText: "PRODUCTION SEND PAGE" })).toBeVisible();

    // Assert that part to scan have a title named "Email Body"
    await expect(popup.locator("span", { hasText: "Email Body" })).toBeVisible();

    const hasRealAnchor = await checkForRealAnchorInTextarea(popup);

    hasRealAnchor
      ? console.log("✅ Valid anchor link found!")
      : console.log("⚠️ No valid anchor link found, but continuing test...");

    const linksWereSaved  = await checkForUrlInPlaceholders(popup);
    expect(linksWereSaved).toBeTruthy();

    // Run your decrementing URL checks starting from the current URL
    await checkPreviousMdUrlsInSameTab(popup, newUrl, { skipCurrent: true });
  });
});
