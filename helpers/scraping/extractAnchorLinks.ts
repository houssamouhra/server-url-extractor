// prettier-ignore
export const extractAnchorLinksFromText  = (html: string): string[] => {


  // Regex: Match anchor hrefs that are real (not placeholders)
const realUrlAnchorRegex = /<a\b[^>]*?href=["']((?![^"']*\[[^\]]*\])[^"']+\.[a-z]{2,}(?:\/[^"']*)?)["']/gi;

const anchorLinks: string[] = [];

let match: RegExpExecArray | null;

while ((match = realUrlAnchorRegex.exec(html)) !== null) {
    if (match[1]) anchorLinks.push(match[1].trim());
}

  return [...new Set(anchorLinks)];
};
