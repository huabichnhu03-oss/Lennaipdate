import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isAdminRequest } from "../../../lib/admin-auth.js";
import { listAssets } from "../../../lib/assets-store.js";

function readToken(req: VercelRequest): string | undefined {
  const h = req.headers["authorization"];
  if (typeof h === "string" && h.toLowerCase().startsWith("bearer ")) {
    return h.slice(7).trim();
  }
  const q = (req.query ?? {}) as Record<string, unknown>;
  if (typeof q.token === "string") return q.token as string;
  return undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAdminRequest({ token: readToken(req) })) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const q = req.query as Record<string, string | undefined>;
  const limit = q.limit ? Number(q.limit) : undefined;
  const offset = q.offset ? Number(q.offset) : undefined;
  const t = q.type;
  const type = (t === "image" || t === "gif" || t === "video" ? t : "all") as
    | "image"
    | "gif"
    | "video"
    | "all";
  try {
    const out = await listAssets({ limit, offset, type, search: q.search });
    res.json(out);
  } catch (err) {
    console.error("[admin] list assets failed", err);
    res.status(500).json({ error: "Failed to load assets" });
  }
}
