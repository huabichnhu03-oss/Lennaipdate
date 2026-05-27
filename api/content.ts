import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAllSections } from "../lib/content-store.js";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const all = await getAllSections();
    res.json(all);
  } catch (err) {
    console.error("[content] read-all failed", err);
    res.status(500).json({ error: "Failed to load content" });
  }
}
