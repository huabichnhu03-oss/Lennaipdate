import crypto from "crypto";
import fs from "fs";
import path from "path";
import { query } from "./db.js";

// Local filesystem storage for assets (replaces Vercel Blob)
// Assets are stored in a persistent directory outside the source tree.

const ASSETS_DIR = process.env.ASSETS_DIR ?? path.join(process.cwd(), "data", "assets");

function ensureAssetsDir(): void {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }
}

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

function makeFilename(originalName: string, ext?: string): string {
  const baseExt = ext ?? ((/\.([a-z0-9]+)$/i.exec(originalName))?.[1] ?? "bin");
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${stamp}-${rand}.${baseExt.toLowerCase()}`;
}

export async function listAssets(opts?: {
  limit?: number;
  offset?: number;
  type?: "image" | "gif" | "video" | "all";
  search?: string;
}): Promise<{ assets: Asset[]; total: number }> {
  const rows = await query<Row>(
    `SELECT id, url, filename, mime, size, width, height, created_at
     FROM assets ORDER BY created_at DESC`,
  );
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
  ensureAssetsDir();
  const ext = (/\.([a-z0-9]+)$/i.exec(input.filename))?.[1];
  const fname = makeFilename(input.filename, ext);
  const fpath = path.join(ASSETS_DIR, fname);
  fs.writeFileSync(fpath, input.buffer);
  const url = `/api/assets/${fname}`;
  const id = crypto.randomUUID();
  const rows = await query<Row>(
    `INSERT INTO assets (id, url, filename, mime, size, width, height)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, url, filename, mime, size, width, height, created_at`,
    [id, url, input.filename || "upload", input.mime, input.buffer.length, input.width ?? null, input.height ?? null],
  );
  return toAsset(rows[0]!);
}

export async function replaceAsset(
  id: string,
  input: { buffer: Buffer; mime: string; width?: number | null; height?: number | null },
): Promise<Asset | null> {
  const existing = await query<Row>(
    "SELECT id, url, filename, mime, size, width, height, created_at FROM assets WHERE id = $1",
    [id],
  );
  if (existing.length === 0) return null;
  const old = toAsset(existing[0]!);

  ensureAssetsDir();
  // Overwrite the existing file at the same path
  const fname = path.basename(old.url);
  const fpath = path.join(ASSETS_DIR, fname);
  fs.writeFileSync(fpath, input.buffer);

  const rows = await query<Row>(
    `UPDATE assets
     SET mime = $1, size = $2, width = $3, height = $4
     WHERE id = $5
     RETURNING id, url, filename, mime, size, width, height, created_at`,
    [input.mime, input.buffer.length, input.width ?? old.width, input.height ?? old.height, id],
  );
  return rows.length > 0 ? toAsset(rows[0]!) : null;
}

export async function renameAsset(id: string, filename: string): Promise<Asset | null> {
  const trimmed = (filename || "").trim().slice(0, 200);
  if (!trimmed) return null;
  const rows = await query<Row>(
    `UPDATE assets SET filename = $1 WHERE id = $2
     RETURNING id, url, filename, mime, size, width, height, created_at`,
    [trimmed, id],
  );
  return rows.length > 0 ? toAsset(rows[0]!) : null;
}

export async function removeAsset(id: string): Promise<boolean> {
  const rows = await query<{ url: string }>(
    "DELETE FROM assets WHERE id = $1 RETURNING url",
    [id],
  );
  if (rows.length === 0) return false;
  // Best-effort local file removal
  try {
    const fname = path.basename(rows[0]!.url);
    const fpath = path.join(ASSETS_DIR, fname);
    if (fs.existsSync(fpath)) fs.unlinkSync(fpath);
  } catch {
    /* ignore */
  }
  return true;
}

export function getAssetFilePath(filename: string): string | null {
  ensureAssetsDir();
  const fpath = path.join(ASSETS_DIR, path.basename(filename));
  return fs.existsSync(fpath) ? fpath : null;
}
