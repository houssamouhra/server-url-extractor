import { Page } from "@playwright/test";

// prettier-ignore
export const checkForRealAnchorInTextarea = async (newPage: Page): Promise<string[]> => {
  const textareaLocator = newPage.locator("#body");

  if (!(await textareaLocator.count())) {
  console.warn("⚠️ Textarea with id='body' not found.");
  return [];
}

  // Get the content of the Textarea
const textareaContent = await textareaLocator.evaluate(
  (el) => (el as HTMLTextAreaElement).value || ""
);

  // Regex: Match anchor hrefs that are real (not placeholders)
const realUrlAnchorRegex = /<a\b[^>]*?href=["']((?![^"']*\[[^\]]*\])[^"']+\.[a-z]{2,}(?:\/[^"']*)?)["']/gi;

const anchorLinks: string[] = [];

let match: RegExpExecArray | null;

while ((match = realUrlAnchorRegex.exec(textareaContent)) !== null) {
  if (match[1]) {
    anchorLinks.push(match[1]);
  }
}

const uniqueAnchors = [...new Set(anchorLinks.map(link => link.trim()))];

  // Check if the it found a valid URL or not
console.log(anchorLinks.length
  ? `🔗 Found ${anchorLinks.length} anchor link(s)`
  : "❌ No anchor links found in #body");
return uniqueAnchors;
};
