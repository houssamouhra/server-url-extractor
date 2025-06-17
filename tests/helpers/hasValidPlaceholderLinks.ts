import { Page } from "@playwright/test";
import { saveLinksToJson } from "./exportToFile";

// prettier-ignore
export const checkForUrlInPlaceholders = async (popup: Page): Promise<string[]> => {
  const placeholderLinks: string[] = [];
  const batchLinks: string[] = [];
  const batchSize = 10;

  const toggles = popup.locator("a.dropdown-toggle");
  const toggleCount = await toggles.count();

  if (toggleCount < 3) {
    console.warn(`⚠️ Only ${toggleCount} toggles found. nth(2) does not exist.` );
    return placeholderLinks;
  }

  const toggleLocator = toggles.nth(2);

  try {
    await toggleLocator.waitFor({ state: "visible", timeout: 5000 });
    const isVisible = await toggleLocator.isVisible();
    console.log(`Dropdown toggle [nth(2)] Visible: ${isVisible}`);

    if (isVisible) {
      await toggleLocator.click({ force: true });
      console.log("✅ Dropdown menu expanded!");
      await popup.waitForSelector('[id^="placeholders-tab-click-4"]', {
        timeout: 3000,
      });
    } else {
      console.warn("⚠️ nth(2) toggle is not visible.");
      return placeholderLinks;
    }
  } catch {
    console.warn("⚠️ nth(2) toggle exists but not visible in time.");
    return placeholderLinks;
  }

  // Get total number of placeholder tabs dynamically
  const placeholderTabs = popup.locator('[id^="placeholders-tab-click-"]');
  const totalTabs = await placeholderTabs.count();
  console.log(`✅ Found ${totalTabs} placeholder tabs.`);

  const urlMatch = popup.url().match(/md\/(\d+)\.html/);
  const baseId = urlMatch ? urlMatch[1] : "unknown";

  for (let i = 1; i <= totalTabs; i++) {
    if (i >= 4) {
      // Re-click toggle to open dropdown again
      await toggleLocator.click({ force: true });
      // Wait a moment for dropdown to expand properly
      await popup.waitForTimeout(300);
    }

    const placeholderTabSelector = `#placeholders-tab-click-${i}`;
    const textareaSelector = `#placeholder${i}`;

    try {
      await popup.waitForSelector(placeholderTabSelector, { timeout: 3000 });
      const placeholderTabLocator = popup.locator(placeholderTabSelector);
      const textareaLocator = popup.locator(textareaSelector);

      await placeholderTabLocator.scrollIntoViewIfNeeded();
      await placeholderTabLocator.waitFor({ state: "visible", timeout: 5000 });

      // Click the tag to show the textarea
      await placeholderTabLocator.click();

      // Wait for textarea to be visible
      await textareaLocator.waitFor({ state: "visible", timeout: 3000 });

      const textareaContent = await textareaLocator.evaluate((el) =>
        el ? (el as HTMLTextAreaElement).value : ""
      );

      // Check if the textarea content contains a valid URL
      const domainLikeRegex = /(?:(?:https?:\/\/|\/\/|www\.)[^\s"']+\.(?:com|net|org|de|info|co|io|gov|edu|uk|us|biz|ru|cn|au|ca)(?:[^\s"']*)|[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.(?:com|net|org|de|info|co|io|gov|edu|uk|us|biz|ru|cn|au|ca))/g

      const matches = textareaContent.match(domainLikeRegex) || [];
      matches.forEach((link) => {
        const cleanLink = link.trim();
        if (cleanLink) {
          batchLinks.push(link);
          placeholderLinks.push(link);
        }
      });


      // Log every batch save or every batch size reached
      const isBatchReady = i % batchSize === 0 || i === totalTabs;
      if (isBatchReady && batchLinks.length > 0) {
        const id = `${baseId}_batch_${Math.ceil(i / batchSize)}`;

        console.log(`Base ID: ${baseId}`);
        console.log(`Saving batch with ${batchLinks.length} links as ID: ${id}`);
        await saveLinksToJson("output.json", id, batchLinks);
        console.log(`✅ Saved batch ${id} with ${batchLinks.length} links`);

        console.log(`Tab ${i}: textarea length ${textareaContent.length}`);
        console.log(`Processing placeholder tab ${i} of ${totalTabs}`);
        console.log(`placeholderLinks total: ${placeholderLinks.length}`);

        batchLinks.length = 0; // Clear batch for next cycle
        await popup.waitForTimeout(100); // Prevent memory spike
      }
      // Memory check every 10 tabs
      if (i % 10 === 0) {
        const memory = process.memoryUsage();
        console.log(`🧠 Memory check at tab ${i}: RSS ${Math.round(memory.rss / 1024 / 1024)} MB`
        );
      }
    } catch (error) {
      console.warn(`⚠️ Skipping placeholder tab ${i} due to error: ${error}`);
      continue;
    }
  }
  return placeholderLinks;
};
