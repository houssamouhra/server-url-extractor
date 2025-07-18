import { Page } from "@playwright/test";
import { parse } from "tldts";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { insertIntoDropLinks } from "@helpers/db/saveDropLinksToDb";
import { extractAnchorLinksFromTextarea } from "@scraping/extractAnchorLinksFromTextarea";

import path from "path";

const dbPath = path.resolve("database/links.sqlite");

export const checkForUrlInPlaceholders = async (
  popup: Page
): Promise<string[]> => {
  const urlMatch = popup.url().match(/md\/(\d+)\.html/);
  const baseId = urlMatch ? urlMatch[1] : "unknown";

  // Guard clause: skip if baseId is not numeric
  if (!/^\d+$/.test(baseId)) {
    console.warn(`Invalid baseId: ${baseId}`);
    return [];
  }

  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  // Load existing dropLinks
  // Skip the entire drop if it's already processed
  const existing = await db.get(
    `SELECT COUNT(*) as count FROM drop_links WHERE batchId LIKE ?`,
    [`${baseId}_%`]
  );
  await db.close();

  if (existing.count > 0) {
    console.log(`❌ Drop ID ${baseId} already processed — skipping`);
    return [];
  }

  const placeholderLinks: string[] = [];
  const collectedAnchorLinks: string[] = [];
  const allUniqueLinks = new Set<string>();
  const batchLinks: string[] = [];

  const toggles = popup.locator("a.dropdown-toggle");
  const toggleCount = await toggles.count();

  if (toggleCount < 3) {
    console.warn(`Only ${toggleCount} toggles found. nth(2) does not exist.`);
    return placeholderLinks;
  }

  const toggleLocator = toggles.nth(2);

  try {
    await toggleLocator.waitFor({ state: "visible", timeout: 5000 });
    const isVisible = await toggleLocator.isVisible();
    console.log(`Dropdown toggle [nth(2)] Visible: ${isVisible}`);

    if (isVisible) {
      await toggleLocator.click({ force: true });
      console.log("Dropdown menu expanded!");
      await popup.waitForSelector('[id^="placeholders-tab-click-4"]', {
        timeout: 3000,
      });
    } else {
      console.warn("nth(2) toggle is not visible.");
      return placeholderLinks;
    }
  } catch {
    console.warn("nth(2) toggle exists but not visible in time.");
    return placeholderLinks;
  }

  // Get total number of placeholder tabs dynamically
  const placeholderTabs = popup.locator('[id^="placeholders-tab-click-"]');
  const totalTabs = await placeholderTabs.count();
  console.log(`Found ${totalTabs} placeholder tabs.`);

  // Skip if ANY drop batch for this baseId already exists
  const anchorLinks = await extractAnchorLinksFromTextarea(popup);

  if (anchorLinks.length > 0) {
    console.log(`🔗 Found ${anchorLinks.length} anchor link(s) in #body`);
  } else {
    console.log("❌ No anchor links found in #body");
  }

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

      const content = await textareaLocator.evaluate(
        (el) => (el as HTMLTextAreaElement).value || el.textContent || ""
      );

      // Check if the textarea content contains a valid URL
      const domainLikeRegex =
        /(?<!@)\b(?:https?:\/\/|\/\/|www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+\b(?:\/[^\s"']*)?/g;

      const matches = content.match(domainLikeRegex) || [];

      console.log(`🔍 [${i}] Regex matched ${matches.length} raw URLs`);
      matches.forEach((url) => console.log(`   - raw: ${url}`));

      const finalUrls = matches
        // sanitize first
        .map((url) => url.trim().replace(/[.,)]+$/, ""))
        .filter((cleanLink) => {
          // Heuristic: reject if URL has only one dot and both parts are short
          const parts = cleanLink.split(".");
          if (parts.length === 2) {
            const [left, right] = parts;
            if (left.length <= 3 && right.length <= 3) return false;
          }

          // top-level domain validation
          const parsed = parse(cleanLink);

          if (!parsed.domain || !parsed.publicSuffix) {
            console.log(`⛔ Invalid domain or TLD: ${cleanLink}`);
            return false;
          }

          return true;
        });

      if (finalUrls.length > 0) {
        console.log(`🌐 [${i}] Found ${finalUrls.length} domain-like URLs`);
        finalUrls.forEach((url) => console.log(`   ✅ accepted: ${url}`));
      } else {
        console.log(`❌ [${i}] No domain-like URLs in textarea #${i}`);
      }

      finalUrls.forEach((link) => {
        const cleanLink = link.trim();
        if (cleanLink && !allUniqueLinks.has(cleanLink)) {
          allUniqueLinks.add(cleanLink);
          placeholderLinks.push(cleanLink);
          batchLinks.push(cleanLink);
        }
      });

      // Extract anchor links and merge with batch
      for (const anchorLink of anchorLinks) {
        const cleanAnchor = anchorLink.trim();
        if (cleanAnchor && !allUniqueLinks.has(cleanAnchor)) {
          allUniqueLinks.add(cleanAnchor);
          collectedAnchorLinks.push(cleanAnchor);
          batchLinks.push(cleanAnchor);
        }
      }
    } catch (error) {
      console.warn(`Skipping placeholder tab ${i} due to error: ${error}`);
      continue;
    }
  }

  // INSERT ONCE after accumulating all links from all placeholders
  if (batchLinks.length > 0) {
    try {
      await insertIntoDropLinks(baseId, batchLinks);
      console.log(
        `✅ Inserted ${batchLinks.length} links for Drop ID ${baseId}`
      );
    } catch (err) {
      console.error(`❌ Failed to insert Drop ID ${baseId}:`, err);
    }
  } else {
    console.log(`⚠️ No valid links found for Drop ID ${baseId}`);
  }

  return Array.from(allUniqueLinks);
};
