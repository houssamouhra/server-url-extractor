import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

export async function resolveWithCurl(
  url: string
): Promise<{ status: number; resolved: string | null; errorCode?: string }> {
  try {
    // Step 1: Try normal curl with -L to follow server redirects
    const curlCommand = `curl --max-time 10 -Ls \
      -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36" \
      -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
      -H "Accept-Language: en-US,en;q=0.9" \
      -o /dev/null -w "%{http_code} %{url_effective}" "${url}"`;

    const { stdout: curlOut } = await execAsync(curlCommand);
    const match = curlOut.trim().match(/^(\d{3})\s+(.+)$/);
    const status = match ? parseInt(match[1]) : 0;
    const resolved = match?.[2].trim() || null;

    function isLikelyStaticUrl(a: string, b: string): boolean {
      if (!b) return false;
      try {
        const urlA = new URL(a);
        const urlB = new URL(b);
        return (
          urlA.hostname === urlB.hostname &&
          urlA.pathname.replace(/\/$/, "") === urlB.pathname.replace(/\/$/, "")
        );
      } catch {
        return false;
      }
    }

    const shouldFallbackToClientRedirect = (
      status: number,
      url: string,
      resolved: string | null
    ) =>
      !resolved ||
      isLikelyStaticUrl(url, resolved) ||
      [0, 403, 429].includes(status);

    // prettier-ignore
    // Step 2: If status is 200 and resolved === original, we suspect client-side redirect
    if (shouldFallbackToClientRedirect(status, url, resolved)) {
      const rawHtmlCommand = `curl --max-time 5 "${url}"`;
      const { stdout: html } = await execAsync(rawHtmlCommand);

      // Look for JS or META redirects
      // Matches JS redirects either "window.location.href" or "document.location.href"
      const jsMatch = html.match(  /(document|window)\.location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i);
      const metaMatch = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^;]+;\s*url=([^"'>]+)["']/i);
      const rawRedirect = jsMatch?.[2] || metaMatch?.[1];

      if (rawRedirect) {
        console.log(`🔁 Extracted redirect from HTML: ${rawRedirect}`);

        const resolvedFallback = new URL(rawRedirect, url).toString();

        const followRedirect = `curl --max-time 5 -Ls -o /dev/null -w "%{http_code} %{url_effective}" "${resolvedFallback}"`;
        const { stdout: followOut } = await execAsync(followRedirect);
        const followMatch = followOut.trim().match(/^(\d{3})\s+(.+)$/);

        if (followMatch) {
          const status = parseInt(followMatch[1]);
          const resolved = followMatch[2].trim();
          return { status, resolved };
        }

        return { status: 200, resolved: resolvedFallback };
      }
    }

    return { status, resolved };
  } catch (err: any) {
    console.warn(`❌ curl error for ${url}: ${err.message}`);
    return { status: 0, resolved: null, errorCode: err.code || "UNKNOWN" };
  }
}
