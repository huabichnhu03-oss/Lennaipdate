import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../../lib/db.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const filename = req.query["filename"] as string;
  if (!filename) {
    res.status(400).json({ error: "Missing filename" });
    return;
  }

  try {
    const rows = await query<{ url: string }>(
      "SELECT url FROM assets WHERE url LIKE $1",
      [`%/${filename}`],
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }
    const blobUrl = rows[0]!.url;
    const response = await fetch(blobUrl);
    if (!response.ok) {
      res.status(404).json({ error: "Asset not found in storage" });
      return;
    }
    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(buffer);
  } catch (err) {
    console.error("[assets] serve failed", err);
    res.status(500).json({ error: "Failed to serve asset" });
  }
}
