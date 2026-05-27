import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isAdminRequest } from "../../../../lib/admin-auth.js";
import { renameAsset } from "../../../../lib/assets-store.js";

function readToken(req: VercelRequest): string | undefined {
  const h = req.headers["authorization"];
  if (typeof h === "string" && h.toLowerCase().startsWith("bearer ")) {
    return h.slice(7).trim();
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  if (typeof body.token === "string") return body.token;
  return undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAdminRequest({ token: readToken(req) })) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const id = req.query["filename"] as string;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const filename = typeof body.filename === "string" ? body.filename : "";
  if (!filename.trim()) {
    res.status(400).json({ error: "Filename cannot be empty." });
    return;
  }
  try {
    const updated = await renameAsset(id, filename);
    if (!updated) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }
    res.json({ ok: true, asset: updated });
  } catch (err) {
    console.error("[admin] rename asset failed", err);
    res.status(500).json({ error: "Failed to rename asset" });
  }
}
