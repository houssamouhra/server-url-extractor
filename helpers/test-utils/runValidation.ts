import { Browser } from "@playwright/test";
import { validateWithCurl } from "@test-utils/validateWithCurl";
import { validateWithPlaywright } from "@test-utils/validateWithPlaywright";
import { ValidatedLink } from "@db/saveValidatedLinksToDb";
import { ValidationContext } from "@test-utils/validationTypes";

export async function runValidation(
  batchId: string,
  linkKey: string,
  url: string,
  browser: Browser,
  ctx: ValidationContext
): Promise<ValidatedLink> {
  const curlResult = await validateWithCurl(batchId, linkKey, url, ctx);

  if (curlResult) {
    return curlResult;
  }

  const playwrightResult = await validateWithPlaywright(
    batchId,
    linkKey,
    url,
    browser,
    ctx
  );

  return playwrightResult;
}
