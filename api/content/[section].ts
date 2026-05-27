import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isAllowedSection, getSection } from "../../lib/content-store.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const section = req.query["section"] as string;
  if (!isAllowedSection(section)) {
    res.status(400).json({ error: "Unknown section" });
    return;
  }
  try {
    const data = await getSection(section);
    res.json(data);
  } catch (err) {
    console.error("[content] read failed", err);
    res.status(500).json({ error: "Failed to load section" });
  }
}
