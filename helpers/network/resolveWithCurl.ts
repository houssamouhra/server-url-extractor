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

    // === Heuristics ===
    const isLikelyStaticUrl = (a: string, b: string): boolean => {
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
    };

    const shouldMarkAsNoRedirect = (
      status: number,
      url: string,
      resolved: string | null
    ): boolean => {
      if (!resolved || resolved === url) return true;
      if (resolved.includes("YOUR_OFFER_URL_HERE")) return true;

      try {
        const originalUrl = new URL(url);
        const resolvedUrl = new URL(resolved);
        const sameHost = originalUrl.hostname === resolvedUrl.hostname;
        const shallowPath =
          resolvedUrl.pathname.split("/").filter(Boolean).length <= 2;
        return status === 200 && sameHost && shallowPath;
      } catch {
        return true;
      }
    };

    const shouldFallbackToClientRedirect = (
      status: number,
      url: string,
      resolved: string | null
    ) =>
      !resolved ||
      resolved.startsWith("chrome-error://") ||
      isLikelyStaticUrl(url, resolved) ||
      status === 0 ||
      (status === 200 && resolved === url);

    // === Step 2: Check for client-side (JS or META) redirects ===
    if (shouldFallbackToClientRedirect(status, url, resolved)) {
      const rawHtmlCommand = `curl --max-time 5 "${url}"`;
      const { stdout: html } = await execAsync(rawHtmlCommand);

      const jsMatch = html.match(
        /(document|window)\.location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i
      );
      const metaMatch = html.match(
        /<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^;]+;\s*url=([^"'>]+)["']/i
      );
      const rawRedirect = jsMatch?.[2] || metaMatch?.[1];

      if (rawRedirect) {
        if (shouldMarkAsNoRedirect(status, url, rawRedirect)) {
          console.warn(`🚫 Ignoring fake redirect: ${rawRedirect}`);
          return { status: 200, resolved: url };
        }

        const resolvedFallback = new URL(rawRedirect, url).toString();
        const followRedirect = `curl --max-time 5 -Ls -o /dev/null -w "%{http_code} %{url_effective}" "${resolvedFallback}"`;
        const { stdout: followOut } = await execAsync(followRedirect);
        const followMatch = followOut.trim().match(/^(\d{3})\s+(.+)$/);

        if (followMatch) {
          const fallbackStatus = parseInt(followMatch[1]);
          const fallbackResolved = followMatch[2].trim();
          return { status: fallbackStatus, resolved: fallbackResolved };
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
