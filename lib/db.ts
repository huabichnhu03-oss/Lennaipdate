import pg from "pg";

const { Pool } = pg;

let _pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!_pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set.");
    }
    _pool = new Pool({ connectionString: url });
  }
  return _pool;
}

let initPromise: Promise<void> | null = null;

export async function ensureSchema(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const pool = getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS content_sections (
        name        TEXT PRIMARY KEY,
        data        JSONB NOT NULL,
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id          UUID PRIMARY KEY,
        name        TEXT NOT NULL,
        email       TEXT NOT NULL,
        message     TEXT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        read_at     TIMESTAMPTZ,
        ip          TEXT,
        user_agent  TEXT
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
        ON contact_messages (created_at DESC)
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id          UUID PRIMARY KEY,
        url         TEXT NOT NULL,
        filename    TEXT NOT NULL,
        mime        TEXT NOT NULL,
        size        BIGINT NOT NULL,
        width       INT,
        height      INT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS assets_created_at_idx
        ON assets (created_at DESC)
    `);
  })();
  try {
    await initPromise;
  } catch (err) {
    initPromise = null;
    throw err;
  }
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(sql, params);
  return result.rows as T[];
}
