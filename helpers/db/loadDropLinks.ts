import { Database } from "sqlite";

export interface RawLinkRow {
  batchId: string;
  linkKey: string;
  validatedAt: string;
  originalUrl: string;
  status: number;
  redirection: boolean;
  redirected_url: string;
  included: boolean;
}

export async function loadDropLinkData(db: Database): Promise<RawLinkRow[]> {
  return await db.all<RawLinkRow[]>(`
    SELECT
      d.id as linkKey,
      d.batchId,
      d.originalUrl,
      d.scrapedAt,
      v.status,
      v.redirection,
      v.redirected_url,
      v.included,
      v.method,
      v.error,
      v.validatedAt
    FROM drop_links d
    LEFT JOIN validated_links v
      ON d.batchId = v.batchId AND d.id = v.linkKey;`);
}
