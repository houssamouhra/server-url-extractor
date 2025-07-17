import { resolveWithCurl } from "@network/resolveWithCurl";
import { isMeaningfulRedirect } from "@network/redirectAnalysis";
import { ValidatedLink } from "@db/saveValidatedLinksToDb";
import { ValidationContext } from "@helpers/test-utils";

export async function validateWithCurl(
  batchId: string,
  linkKey: string,
  normalizedUrl: string,
  ctx: ValidationContext
): Promise<ValidatedLink | null> {
  const {
    status: curlStatus,
    resolved: curlResolved,
    errorCode,
  } = await resolveWithCurl(normalizedUrl);

  const isServerRedirect = curlStatus >= 300 && curlStatus < 400;
  const isSoftRedirect =
    curlStatus === 200 &&
    curlResolved !== null &&
    isMeaningfulRedirect(normalizedUrl, curlResolved);

  const redirectionHappened = isServerRedirect || isSoftRedirect;
  const included =
    !!curlResolved && ctx.ids.some((id) => curlResolved.includes(String(id)));

  const result: ValidatedLink = {
    linkKey,
    original: normalizedUrl,
    status: curlStatus,
    redirection: redirectionHappened,
    redirected_url: redirectionHappened ? curlResolved : null,
    included,
    method: "curl",
    validatedAt: ctx.validatedAt,
  };

  // Success — no need for Playwright fallback
  if (curlResolved && curlStatus < 400) {
    return result;
  }

  // Hard fail — don't fallback
  if (
    [0, 403, 404, 429, 530].includes(curlStatus) &&
    curlResolved === normalizedUrl
  ) {
    return {
      ...result,
      error:
        errorCode === "ENOTFOUND"
          ? "DNS could not be resolved"
          : `curl gave status ${curlStatus}, skipping playwright`,
    };
  }

  // If fallback is needed, return null
  return null;
}
