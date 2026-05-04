import { neon, neonConfig } from "@neondatabase/serverless";
import crypto from "crypto";

// Postgres-backed inbox for the contact form on Vercel/Neon.
// Mirrors the JSON-file implementation in the Replit api-server so the
// admin UI talks to the same shape on both deployments.

neonConfig.fetchConnectionCache = true;

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  ip: string | null;
  userAgent: string | null;
};

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

// Auto-create the table on first use. Cached per cold-start so each
// warm function instance only runs the DDL once.
async function ensureSchema(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const sql = getClient();
    await sql`
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
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
        ON contact_messages (created_at DESC)
    `;
  })();
  try {
    await initPromise;
  } catch (err) {
    initPromise = null;
    throw err;
  }
}

type Row = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string | Date;
  read_at: string | Date | null;
  ip: string | null;
  user_agent: string | null;
};

function toMessage(r: Row): ContactMessage {
  const toIso = (v: string | Date): string =>
    typeof v === "string" ? v : v.toISOString();
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    message: r.message,
    createdAt: toIso(r.created_at),
    readAt: r.read_at == null ? null : toIso(r.read_at),
    ip: r.ip,
    userAgent: r.user_agent,
  };
}

export async function listMessages(): Promise<ContactMessage[]> {
  await ensureSchema();
  const sql = getClient();
  const rows = (await sql`
    SELECT id, name, email, message, created_at, read_at, ip, user_agent
    FROM contact_messages
    ORDER BY created_at DESC
  `) as Row[];
  return rows.map(toMessage);
}

export async function insertMessage(input: {
  name: string;
  email: string;
  message: string;
  ip: string | null;
  userAgent: string | null;
}): Promise<ContactMessage> {
  await ensureSchema();
  const sql = getClient();
  const id = crypto.randomUUID();
  const rows = (await sql`
    INSERT INTO contact_messages (id, name, email, message, ip, user_agent)
    VALUES (${id}, ${input.name}, ${input.email}, ${input.message}, ${input.ip}, ${input.userAgent})
    RETURNING id, name, email, message, created_at, read_at, ip, user_agent
  `) as Row[];
  return toMessage(rows[0]!);
}

export async function setMessageRead(
  id: string,
  read: boolean,
): Promise<ContactMessage | null> {
  await ensureSchema();
  const sql = getClient();
  const rows = (await sql`
    UPDATE contact_messages
    SET read_at = ${read ? new Date().toISOString() : null}
    WHERE id = ${id}
    RETURNING id, name, email, message, created_at, read_at, ip, user_agent
  `) as Row[];
  if (rows.length === 0) return null;
  return toMessage(rows[0]!);
}

export async function deleteMessage(id: string): Promise<boolean> {
  await ensureSchema();
  const sql = getClient();
  const rows = (await sql`DELETE FROM contact_messages WHERE id = ${id} RETURNING id`) as Array<{ id: string }>;
  return rows.length > 0;
}
