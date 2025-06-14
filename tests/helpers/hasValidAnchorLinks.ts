import { Page } from "@playwright/test";

// prettier-ignore
export const checkForRealAnchorInTextarea = async (newPage: Page, browserName: string): Promise<boolean>  =>  {
    // Textarea content is not visible on Firefox
    if (browserName !== 'firefox') {
      const textareaLocator = newPage.locator('#body');

      // Show the content of the Textarea first
      const textareaContent = await textareaLocator.evaluate(el => (el as HTMLTextAreaElement).value);
      console.log('✅ Textarea content:', textareaContent);
      
      // Regex: Skip any hrefs that include [placeholder]
      const realUrlAnchorRegex = /<a\s+href=["'](?![^"']*\[placeholder)[^"']*\.[a-z]{2,}[^"']*["']/i;
      const hasRealUrl = realUrlAnchorRegex.test(textareaContent);

      // Check if the it found a valid URL or not
      console.log(hasRealUrl ? '✅ Found anchor link in textarea!' : '❌ No anchor link found in textarea!');
      return hasRealUrl;

    } else {
      console.log('⚠️ Skipping textarea content check on Firefox.');
      return false;
    }
}
