import { Page } from "@playwright/test";

// prettier-ignore
export const checkForUrlInPlaceholders = async (newPage: Page): Promise<boolean> => {
  let foundValidUrl = false;

  // Expand dropdown if toggle exists
  const toggleLocator = newPage.locator("a.dropdown-toggle").nth(2);

  const toggleVisible = await toggleLocator.isVisible();
  console.log(`📌 Dropdown toggle visibility: ${toggleVisible}`);

  const toggleCount = await toggleLocator.count();
  if (toggleCount > 0) {
    const toggleVisible = await toggleLocator.isVisible();
    console.log(`Dropdown toggle exists: true | Visible: ${toggleVisible}`);

    if (toggleVisible) {
      await toggleLocator.click({ force: true });
      console.log("✅ Dropdown menu expanded to reveal additional placeholders.");
    } else {
      console.log("⚠️ Dropdown toggle exists but is not visible. Placeholders 5+ may not be reachable!");
    }
  } else {
    console.log("⚠️ Dropdown toggle not found at all!");
  }

  // Get total number of placeholder tabs dynamically
  const placeholderTabs = await newPage
    .locator('[id^="placeholders-tab-click-"]')
    .elementHandles();
  const totalTabs = placeholderTabs.length;

  console.log(`✅ Found ${totalTabs} placeholder tabs.`);

  for (let i = 1; i <= totalTabs; i++) {
    const placeholderTabSelector = `#placeholders-tab-click-${i}`;
    const textareaSelector = `#placeholder${i}`;

    const placeholderTabLocator = newPage.locator(placeholderTabSelector);
    const textareaLocator = newPage.locator(textareaSelector);

    // Check if the textarea is visible before clicking
    if (!(await placeholderTabLocator.isVisible())) {
      console.log(`⚠️ Placeholder tab ${i} is not visible before the toggle is active`);
      continue;
    }

    // Click the tag to show the textarea
    await placeholderTabLocator.click();

    // Wait for textarea to be visible
    await textareaLocator.waitFor({ state: "visible" });

    const textareaContent = await textareaLocator.evaluate((el) => (el as HTMLTextAreaElement).value);

    // Check if the textarea content contains a valid URL
    const domainLikeRegex =/https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
    const hasDomainText = domainLikeRegex.test(textareaContent);

    if (hasDomainText) {
      console.log(`✅ Found valid link in placeholder${i}!`);
      foundValidUrl = true;
    } else {
      console.log(`⚠️ No valid link found in placeholder${i}, continuing.`);
    }
  }

  return foundValidUrl;
};
