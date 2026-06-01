import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getAllSections,
  getContentSectionMeta,
  getSection,
  isAllowedSection,
} from "../lib/content-store.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const section = req.query["section"];
  if (typeof section === "string") {
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
    return;
  }
  try {
    const all = await getAllSections();
    const includeMeta = req.query["meta"] === "1";
    if (!includeMeta) {
      res.json(all);
      return;
    }
    const meta = await getContentSectionMeta();
    res.json({ data: all, meta });
  } catch (err) {
    console.error("[content] read-all failed", err);
    res.status(500).json({ error: "Failed to load content" });
  }
}
