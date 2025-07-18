import { Page } from "@playwright/test";
import { extractAnchorLinksFromText } from "@scraping/extractAnchorLinks";

// Optional param: fallback to "#body"
export const extractAnchorLinksFromTextarea = async (
  page: Page,
  selector: string = "#body"
): Promise<string[]> => {
  const locator = page.locator(selector);
  const content = await locator.evaluate(
    (el) => (el as HTMLTextAreaElement).value || el.textContent || ""
  );
  return extractAnchorLinksFromText(content);
};
