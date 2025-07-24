import { insertIntoValidatedLinks } from "@db/saveValidatedLinksToDb.ts";
import type { ValidatedLink } from "@db/saveValidatedLinksToDb.ts";

export async function insertInChunks(
  batchId: string,
  links: ValidatedLink[],
  chunkSize = 100,
  delayMs = 0 // Optional delay between chunks to avoid lock contention
): Promise<void> {
  for (let i = 0; i < links.length; i += chunkSize) {
    const chunk = links.slice(i, i + chunkSize);

    try {
      await insertIntoValidatedLinks(batchId, chunk);
      console.log(
        `✅ Inserted chunk ${i / chunkSize + 1} of ${Math.ceil(
          links.length / chunkSize
        )}`
      );
    } catch (err) {
      console.error(`❌ Failed to insert chunk starting at index ${i}:`, err);
      throw err;
    }

    if (delayMs > 0) {
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
}
