import { Page } from "@playwright/test";

// prettier-ignore
export const checkForRealAnchorInTextarea = async (newPage: Page): Promise<string[]> => {
  const textareaLocator = newPage.locator("#body");

  // Show the content of the Textarea first
  const textareaContent = await textareaLocator.evaluate((el) => (el as HTMLTextAreaElement).value);

  // Regex: Skip any hrefs that include [placeholder]
  const realUrlAnchorRegex = /<a\s+href=["'](?![^"']*\[placeholder)([^"']+\.[a-z]{2,}[^"']*)["']/gi;

const anchorLinks: string[] = [];
let match: RegExpExecArray | null;

while ((match = realUrlAnchorRegex.exec(textareaContent)) !== null) {
  if (match[1]) { // match[1] contains the captured URL, not the full <a ...>
    anchorLinks.push(match[1]);
  }
}
  // Check if the it found a valid URL or not
  console.log(anchorLinks.length ? "✅ Found anchor link!" : "❌ No anchor link found!");
  return anchorLinks;
};
