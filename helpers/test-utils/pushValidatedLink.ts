import type { ValidatedLink } from "@db/saveValidatedLinksToDb"; // adjust path as needed

export function pushValidatedLink(
  target: Record<string, ValidatedLink[]>,
  batchId: string,
  link: ValidatedLink
) {
  if (!target[batchId]) {
    target[batchId] = [];
  }
  target[batchId].push(link);
}
