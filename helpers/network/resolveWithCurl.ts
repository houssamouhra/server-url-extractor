import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

export async function resolveWithCurl(
  url: string
): Promise<{ status: number; resolved: string | null; errorCode?: string }> {
  try {
    const isHtml = url.trim().toLowerCase().endsWith(".html");

    if (isHtml) {
      // Use raw HTML fetch for .html links (to catch JS redirection)
      const jsCurlCommand = `curl --max-time 10 "${url}"`;
      const { stdout } = await execAsync(jsCurlCommand);

      // Try to extract JS redirection
      const jsMatch = stdout.match(
        /document\.location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i
      );
      const metaMatch = stdout.match(
        /<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^;]+;\s*url=([^"']+)["']/i
      );

      const extractedUrl = jsMatch?.[1] || metaMatch?.[1];

      if (extractedUrl) {
        // Step 3: follow extracted redirect to get final resolved URL + status
        const redirectCurlCommand = `curl --max-time 10 -Ls -o NUL -w "%{http_code} %{url_effective}" "${extractedUrl}"`;
        const { stdout: redirectOut } = await execAsync(redirectCurlCommand);

        const match = redirectOut.trim().match(/^(\d{3})\s+(.+)$/);
        if (match) {
          const status = parseInt(match[1]);
          const resolved = match[2].trim();
          return { status, resolved };
        }
        return { status: 200, resolved: extractedUrl };
      }
      return { status: 200, resolved: url };
    }

    const curlCommand = `curl --max-time 10 -Ls -o NUL -w "%{http_code} %{url_effective}" "${url}"`;
    const { stdout } = await execAsync(curlCommand);

    const match = stdout.trim().match(/^(\d{3})\s+(.+)$/);
    if (!match) {
      console.warn(`Could not parse curl output for ${url}`);
      return { status: 0, resolved: null };
    }

    const status = parseInt(match[1]);
    const resolved = match[2].trim();

    return {
      status,
      resolved: resolved || null,
    };
  } catch (err: any) {
    console.warn(`curl threw error for ${url}: ${err.message}`);
    return { status: 0, resolved: null, errorCode: err.code || "UNKNOWN" };
  }
}
