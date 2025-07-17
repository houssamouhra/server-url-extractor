import { Database } from "sqlite";

export async function loadValidatedCounts(
  db: Database
): Promise<Record<string, number>> {
  const countRows = await db.all<{ batchId: string; count: number }[]>(`
    SELECT batchId, COUNT(*) as count
    FROM validated_links
    GROUP BY batchId
  `);

  const result: Record<string, number> = {};
  for (const row of countRows) {
    result[row.batchId] = row.count;
  }
  return result;
}
