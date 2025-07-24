import type { Page } from "playwright";
import { extractAnchorLinksFromText } from "@scraping/extractAnchorLinks.ts";

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
