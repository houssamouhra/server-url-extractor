import { Page } from "@playwright/test";
import { checkForUrlInPlaceholders } from "./hasValidPlaceholderLinks";
import { checkForRealAnchorInTextarea } from "./hasValidAnchorLinks";

/**
 * Goes to the current URL first
 * then to the previous 99 /md/xxxxx.html pages (decrementing) in the same tab,
 * checking for valid placeholders and anchor links.
 */
// prettier-ignore
export const checkPreviousMdUrlsInSameTab = async (popup: Page,originalUrl: string,options?: { skipCurrent?: boolean }): Promise<void> => {
  const match = originalUrl.match(/md\/(\d+)\.html/);

  if (!match || !match[1]) {
    console.log("❌ Could not extract the MD number from URL!");
    return;
  }

  const baseNumber = parseInt(match[1], 10);
  const urlPrefix = originalUrl.split(/md\/\d+\.html/)[0];

  const processPage = async (url: string) => {
    await popup.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await popup.waitForTimeout(500);

    const anchorLinks = await checkForRealAnchorInTextarea(popup);
    const placeholderLinks = await checkForUrlInPlaceholders(popup);

    return { anchorLinks, placeholderLinks };
  };

  // If skipCurrent is false or undefined, check the original URL first
  if (!options?.skipCurrent) {
    console.log(`🚀 Checking original URL first: ${originalUrl}`);

    try {
      const { anchorLinks, placeholderLinks } = await processPage(originalUrl);
      const allLinks = [...placeholderLinks, ...anchorLinks];

      if (allLinks.length > 0) {
        console.log(`✅ Found valid content at ${originalUrl}`);
      } else {
        console.log(`❌ No valid content found at ${originalUrl}`);
      }
    } catch (error) {
      console.log(`⚠️ Failed to load or process ${originalUrl}:`, error);
    }
  }

  // Start from 1 until 100
  const startIndex = 1;
  const maxChecks = 100;
  let totalValidLinks = 0;

  for (let i = startIndex; i < maxChecks; i++) {
    const newNumber = baseNumber - i;
    if (newNumber <= 0) break;

    const newUrl = `${urlPrefix}md/${newNumber}.html`;
    console.log(`🚀 Navigating to: ${newUrl}`);

    
    try {
      const { anchorLinks, placeholderLinks } = await processPage(newUrl);
      const allLinks = [...placeholderLinks, ...anchorLinks];
   
      console.log(
        anchorLinks.length > 0
          ? `✅ [${i + 1}] Valid anchor link found at ${newUrl}!`
          : `⚠️ [${i + 1}] No valid anchor link found at ${newUrl}, but continuing test...`
      );

      console.log(
        placeholderLinks.length > 0
          ? `✅ [${i + 1}] Valid placeholder link found at ${newUrl}!`
          : `⚠️ [${i + 1}] No valid placeholder link found at ${newUrl}, but continuing test...`
      );

      totalValidLinks += allLinks.length;
      console.log(`🔍 Total valid links found in all 100 checks: ${totalValidLinks}`);

      if (allLinks.length > 0) {
        console.log(`✅ Found valid content at ${newUrl}`);
      } else {
        console.log(`❌ No valid content found at ${newUrl}`);
      }
    } catch (error) {
      console.log(`⚠️ Failed to load or process ${newUrl}:`, error);
    }
  }

  console.log(`🏁 Total valid links found in all ${maxChecks} checks: ${totalValidLinks}`);
};
