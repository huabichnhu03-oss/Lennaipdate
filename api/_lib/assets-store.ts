import { neon, neonConfig } from "@neondatabase/serverless";
import crypto from "crypto";
import {
  putAsset,
  replaceAssetAt,
  deleteAsset as deleteBlob,
} from "./asset-storage.js";

// Postgres-backed asset metadata store. Mirrors the JSON-file
// implementation in the Replit api-server so the admin UI talks to the
// same shape on both deployments.

neonConfig.fetchConnectionCache = true;

export type Asset = {
  id: string;
  url: string;
  filename: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
};

let initPromise: Promise<void> | null = null;

function getClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set.");
  }
  return neon(url);
}

async function ensureSchema(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const sql = getClient();
    await sql`
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
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS assets_created_at_idx
        ON assets (created_at DESC)
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
  url: string;
  filename: string;
  mime: string;
  size: string | number;
  width: number | null;
  height: number | null;
  created_at: string | Date;
};

function toAsset(r: Row): Asset {
  const toIso = (v: string | Date): string =>
    typeof v === "string" ? v : v.toISOString();
  return {
    id: r.id,
    url: r.url,
    filename: r.filename,
    mime: r.mime,
    size: Number(r.size),
    width: r.width,
    height: r.height,
    createdAt: toIso(r.created_at),
  };
}

export function assetType(mime: string): "image" | "gif" | "video" | "other" {
  if (mime === "image/gif") return "gif";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "other";
}

export async function listAssets(opts?: {
  limit?: number;
  offset?: number;
  type?: "image" | "gif" | "video" | "all";
  search?: string;
}): Promise<{ assets: Asset[]; total: number }> {
  await ensureSchema();
  const sql = getClient();
  const rows = (await sql`
    SELECT id, url, filename, mime, size, width, height, created_at
    FROM assets
    ORDER BY created_at DESC
  `) as Row[];
  let assets = rows.map(toAsset);
  const type = opts?.type ?? "all";
  if (type !== "all") {
    assets = assets.filter((a) => assetType(a.mime) === type);
  }
  const search = (opts?.search ?? "").trim().toLowerCase();
  if (search) {
    assets = assets.filter((a) => a.filename.toLowerCase().includes(search));
  }
  const total = assets.length;
  const offset = Math.max(0, opts?.offset ?? 0);
  const limit = Math.max(1, Math.min(opts?.limit ?? 100, 200));
  return { assets: assets.slice(offset, offset + limit), total };
}

export async function uploadAsset(input: {
  buffer: Buffer;
  filename: string;
  mime: string;
  width?: number | null;
  height?: number | null;
}): Promise<Asset> {
  await ensureSchema();
  const stored = await putAsset(input.filename || "upload", input.buffer, input.mime);
  const id = crypto.randomUUID();
  const sql = getClient();
  const rows = (await sql`
    INSERT INTO assets (id, url, filename, mime, size, width, height)
    VALUES (
      ${id},
      ${stored.url},
      ${input.filename || "upload"},
      ${input.mime},
      ${input.buffer.length},
      ${input.width ?? null},
      ${input.height ?? null}
    )
    RETURNING id, url, filename, mime, size, width, height, created_at
  `) as Row[];
  return toAsset(rows[0]!);
}

export async function replaceAsset(
  id: string,
  input: { buffer: Buffer; mime: string; width?: number | null; height?: number | null },
): Promise<Asset | null> {
  await ensureSchema();
  const sql = getClient();
  const existing = (await sql`SELECT id, url, filename, mime, size, width, height, created_at FROM assets WHERE id = ${id}`) as Row[];
  if (existing.length === 0) return null;
  const old = toAsset(existing[0]!);
  const stored = await replaceAssetAt(old.url, input.buffer, input.mime);
  const rows = (await sql`
    UPDATE assets
    SET url = ${stored.url},
        mime = ${input.mime},
        size = ${input.buffer.length},
        width = ${input.width ?? old.width},
        height = ${input.height ?? old.height}
    WHERE id = ${id}
    RETURNING id, url, filename, mime, size, width, height, created_at
  `) as Row[];
  return rows.length > 0 ? toAsset(rows[0]!) : null;
}

export async function renameAsset(
  id: string,
  filename: string,
): Promise<Asset | null> {
  await ensureSchema();
  const sql = getClient();
  const trimmed = (filename || "").trim().slice(0, 200);
  if (!trimmed) return null;
  const rows = (await sql`
    UPDATE assets
    SET filename = ${trimmed}
    WHERE id = ${id}
    RETURNING id, url, filename, mime, size, width, height, created_at
  `) as Row[];
  return rows.length > 0 ? toAsset(rows[0]!) : null;
}

export async function removeAsset(id: string): Promise<boolean> {
  await ensureSchema();
  const sql = getClient();
  const rows = (await sql`
    DELETE FROM assets WHERE id = ${id}
    RETURNING url
  `) as Array<{ url: string }>;
  if (rows.length === 0) return false;
  await deleteBlob(rows[0]!.url);
  return true;
}
