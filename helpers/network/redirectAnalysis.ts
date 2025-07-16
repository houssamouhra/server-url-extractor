// Check for meaningful redirections
const normalizePath = (path: string) =>
  path.replace(/\/+$/, "").toLowerCase() || "/";
const normalizeHost = (host: string) =>
  host.replace(/^www\./, "").toLowerCase();

const safePaths = new Set([
  "/",
  "/home",
  "/dashboard",
  "/login",
  "/checkaccount.html",
]);

const safeHostPatterns: [RegExp, RegExp][] = [
  [/^gmail\.com$/, /^accounts\.google\.com$/],
  [/^google\.com$/, /^mail\.google\.com$/],
  [/^icloud\.com$/, /^appleid\.apple\.com$/],
  [/^housebeautiful\.co\.uk$/, /^www\.housebeautiful\.com$/],
];

// prettier-ignore
const areHostsEquivalent = (hostA: string, hostB: string): boolean => {
  const normalizedA = normalizeHost(hostA);
  const normalizedB = normalizeHost(hostB);

  return (normalizedA === normalizedB || safeHostPatterns.some(
      ([patternA, patternB]) =>
        (patternA.test(normalizedA) && patternB.test(normalizedB)) ||
        (patternB.test(normalizedA) && patternA.test(normalizedB))
    )
  );
};

export const isMeaningfulRedirect = (
  original: string,
  redirected: string
): boolean => {
  if (original === redirected) return false;

  try {
    const originalUrl = new URL(original);
    const redirectedUrl = new URL(redirected);

    const hostA = normalizeHost(originalUrl.hostname);
    const hostB = normalizeHost(redirectedUrl.hostname);

    const pathA = normalizePath(originalUrl.pathname);
    const pathB = normalizePath(redirectedUrl.pathname);

    const queryA = originalUrl.searchParams.toString();
    const queryB = redirectedUrl.searchParams.toString();

    const isSameHost = hostA === hostB;
    const isInternalRedirect = areHostsEquivalent(hostA, hostB);

    const isSafePathCombo =
      (safePaths.has(pathA) && safePaths.has(pathB)) ||
      (safePaths.has(pathA) && pathB === "/") ||
      (pathA === "/" && safePaths.has(pathB));

    const isSameQuery = queryA === queryB || (!queryA && !queryB);

    return !(
      (isSameHost || isInternalRedirect) &&
      isSafePathCombo &&
      isSameQuery
    );
  } catch (err) {
    return true; // If parsing fails, assume it's a redirect to be safe
  }
};
