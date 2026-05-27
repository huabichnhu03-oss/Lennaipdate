import crypto from "crypto";
import { query } from "./db.js";

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
    readAt: r.read_at == null ? null : toIso(r.read_at as string | Date),
    ip: r.ip,
    userAgent: r.user_agent,
  };
}

export async function listMessages(): Promise<ContactMessage[]> {
  const rows = await query<Row>(
    `SELECT id, name, email, message, created_at, read_at, ip, user_agent
     FROM contact_messages ORDER BY created_at DESC`,
  );
  return rows.map(toMessage);
}

export async function insertMessage(input: {
  name: string;
  email: string;
  message: string;
  ip: string | null;
  userAgent: string | null;
}): Promise<ContactMessage> {
  const id = crypto.randomUUID();
  const rows = await query<Row>(
    `INSERT INTO contact_messages (id, name, email, message, ip, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, message, created_at, read_at, ip, user_agent`,
    [id, input.name, input.email, input.message, input.ip, input.userAgent],
  );
  return toMessage(rows[0]!);
}

export async function setMessageRead(
  id: string,
  read: boolean,
): Promise<ContactMessage | null> {
  const rows = await query<Row>(
    `UPDATE contact_messages
     SET read_at = $1
     WHERE id = $2
     RETURNING id, name, email, message, created_at, read_at, ip, user_agent`,
    [read ? new Date().toISOString() : null, id],
  );
  if (rows.length === 0) return null;
  return toMessage(rows[0]!);
}

export async function deleteMessage(id: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    "DELETE FROM contact_messages WHERE id = $1 RETURNING id",
    [id],
  );
  return rows.length > 0;
}
