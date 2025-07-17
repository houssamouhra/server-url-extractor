// Check for meaningful redirections
const normalizePath = (path: string) => path.replace(/\/+$/, "").toLowerCase();
const normalizeHost = (host: string) =>
  host.replace(/^www\./, "").toLowerCase();

// DEPRECATED – static paths replaced with dynamic scoring

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

const getPathDepth = (path: string): number =>
  path.split("/").filter(Boolean).length;

const getPathSimilarity = (a: string, b: string): number => {
  const partsA = a.split("/").filter(Boolean);
  const partsB = b.split("/").filter(Boolean);

  let matches = 0;
  for (let i = 0; i < Math.min(partsA.length, partsB.length); i++) {
    if (partsA[i] === partsB[i]) matches++;
    else break;
  }
  return matches;
};

const strongRedirectKeywords = [
  "product",
  "offer",
  "checkout",
  "track",
  "go",
  "redirect",
  "out",
  "deal",
];

export const isMeaningfulRedirect = (
  original: string,
  redirected: string
): boolean => {
  if (original === redirected) return false;

  try {
    const isShortLink = (url: URL): boolean => {
      const host = normalizeHost(url.hostname);
      const path = url.pathname.replace(/\/+$/, "");
      const pathParts = path.split("/").filter(Boolean);

      // Heuristic 1: Short domain
      if (host.length <= 7) return true;
      // just in case someone gives a domain with no TLD
      if (!host.includes(".")) return false;

      // Heuristic 2: Very short and random path
      if (
        pathParts.length === 1 &&
        /^[a-zA-Z0-9]{5,12}$/.test(pathParts[0]) &&
        !pathParts[0].includes("-") &&
        !pathParts[0].includes("_")
      ) {
        const shortTLDs = [
          ".ly",
          ".gl",
          ".to",
          ".at",
          ".co",
          ".gg",
          ".gy",
          ".sh",
        ];
        return shortTLDs.some((tld) => host.endsWith(tld));
      }

      return false;
    };

    const originalUrl = new URL(original);
    const redirectedUrl = new URL(redirected);
    const shortLinkUsed = isShortLink(originalUrl);

    const hostA = normalizeHost(originalUrl.hostname);
    const hostB = normalizeHost(redirectedUrl.hostname);

    const pathA = normalizePath(originalUrl.pathname);
    const pathB = normalizePath(redirectedUrl.pathname);

    const queryA = originalUrl.searchParams.toString();
    const queryB = redirectedUrl.searchParams.toString();

    const isSameHost = hostA === hostB;
    const isInternalRedirect = areHostsEquivalent(hostA, hostB);

    const isSameQuery = queryA === queryB || (!queryA && !queryB);

    const isSameProtocol = originalUrl.protocol === redirectedUrl.protocol;

    const depthA = getPathDepth(pathA);
    const depthB = getPathDepth(pathB);
    const similarity = getPathSimilarity(pathA, pathB);

    const isLikelyRedirectPurpose = strongRedirectKeywords.some((kw) =>
      pathB.toLowerCase().includes(kw)
    );

    // Core rule: Is this a trivial redirect?
    const isTrivialRedirect =
      (isSameHost || isInternalRedirect) &&
      similarity >= 1 &&
      Math.abs(depthA - depthB) <= 1 &&
      !isLikelyRedirectPurpose;

    // Real jump from a short link
    if (shortLinkUsed && hostA !== hostB) return true;

    // Clear intent (purposeful path)
    if (isLikelyRedirectPurpose && !areHostsEquivalent(hostA, hostB))
      return true;

    // Same host, same path, same query, just protocol change → not meaningful
    if (isSameHost && pathA === pathB && isSameQuery && isSameProtocol) {
      return false;
    }
    if (process.env.NODE_ENV === "development") {
      console.log({
        original,
        redirected,
        isSameHost,
        isInternalRedirect,
        similarity,
        depthA,
        depthB,
        isTrivialRedirect,
        shortLinkUsed,
        isLikelyRedirectPurpose,
      });
    }
    // Main rule
    return !isTrivialRedirect;
  } catch (err) {
    return true; // Fail-safe: assume redirect is meaningful
  }
};
