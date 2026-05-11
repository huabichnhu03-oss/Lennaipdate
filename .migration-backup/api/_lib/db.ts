import { neon, neonConfig } from "@neondatabase/serverless";

// Use fetch-based driver — works inside Vercel serverless without
// long-lived TCP pools. One Neon HTTP request per query.
neonConfig.fetchConnectionCache = true;

let initPromise: Promise<void> | null = null;

function getClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string in Vercel → Project → Settings → Environment Variables.",
    );
  }
  return neon(url);
}

// Create the table on first use. Cheap (CREATE IF NOT EXISTS) and idempotent.
// Cached per cold-start so it only runs once per warm function instance.
export async function ensureSchema(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const sql = getClient();
    await sql`
      CREATE TABLE IF NOT EXISTS content_sections (
        name        TEXT PRIMARY KEY,
        data        JSONB NOT NULL,
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
  })();
  try {
    await initPromise;
  } catch (err) {
    initPromise = null;
    throw err;
  }
}

export async function readSection(name: string): Promise<unknown | null> {
  await ensureSchema();
  const sql = getClient();
  const rows = (await sql`SELECT data FROM content_sections WHERE name = ${name}`) as Array<{ data: unknown }>;
  if (rows.length === 0) return null;
  return rows[0]!.data;
}

export async function writeSection(name: string, data: unknown): Promise<void> {
  await ensureSchema();
  const sql = getClient();
  // Postgres UPSERT — insert-or-replace by primary key.
  await sql`
    INSERT INTO content_sections (name, data, updated_at)
    VALUES (${name}, ${JSON.stringify(data)}::jsonb, now())
    ON CONFLICT (name) DO UPDATE
      SET data = EXCLUDED.data,
          updated_at = now()
  `;
}

export async function readAllSections(): Promise<Record<string, unknown>> {
  await ensureSchema();
  const sql = getClient();
  const rows = (await sql`SELECT name, data FROM content_sections`) as Array<{
    name: string;
    data: unknown;
  }>;
  const out: Record<string, unknown> = {};
  for (const r of rows) out[r.name] = r.data;
  return out;
}
