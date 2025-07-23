export function isLikelyFinal(url: string): boolean {
  return (
    !url.includes("redirect") &&
    !url.includes("intermediate") &&
    !url.includes("tracking") &&
    !url.includes("out.") &&
    !url.includes("go.") &&
    !url.includes("exit")
  );
}
