import { isMeaningfulRedirect } from "@network/redirectAnalysis";
import type { ValidatedLink } from "@db/saveValidatedLinksToDb";
import type { ValidationContext } from "@test-utils/validationTypes";

export async function validateWithPlaywright(
  batchId: string,
  linkKey: string,
  url: string,
  browser: any,
  ctx: ValidationContext
): Promise<ValidatedLink> {
  let resolved: string | null = null;
  let status = 0;

  try {
    const page = await browser.newPage();
    const response = await page.goto(url, {
      waitUntil: "load",
      timeout: 15000,
    });

    await page.waitForTimeout(500); // optional: wait for redirects or JS redirects
    resolved = page.url();
    status = response?.status() ?? 0;
    await page.close();
  } catch (err: any) {
    console.error(`⚠️ Playwright error for ${url}:`, err.message);
    resolved = null;
    status = 0;
  }

  const isServerRedirect = status >= 300 && status < 400;
  const isSoftRedirect =
    status === 200 && resolved !== null && isMeaningfulRedirect(url, resolved);

  const redirectionHappened =
    (isServerRedirect || isSoftRedirect) && ![0, 403, 404].includes(status);

  const included =
    resolved && ctx.ids.some((id) => resolved.includes(String(id)));

  if (!resolved || status === 0) {
    console.log(
      `❌ Link ${url} failed: status=${status}, resolved=${resolved}`
    );
    return {
      linkKey,
      original: url,
      status,
      redirection: false,
      redirected_url: null,
      included: false,
      method: "playwright",
      error: "unresolved or failed (status 0)",
      validatedAt: ctx.validatedAt,
    };
  }

  return {
    linkKey,
    original: url,
    status,
    redirection: redirectionHappened,
    redirected_url: redirectionHappened ? resolved : null,
    included: !!included,
    method: "playwright",
    ...(resolved === null && { error: "timeout or navigation failure" }),
    validatedAt: ctx.validatedAt,
  };
}
