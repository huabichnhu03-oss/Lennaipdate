import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readResumeBlob } from "../../lib/resume-storage.js";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const blob = await readResumeBlob();
    if (!blob) {
      res.status(404).json({ error: "No uploaded resume found." });
      return;
    }
    res.setHeader("Content-Type", blob.contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${blob.filename.replace(/"/g, "")}"`,
    );
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(blob.buffer);
  } catch (err) {
    console.error("[files] resume read failed", err);
    res.status(500).json({ error: "Failed to load resume." });
  }
}
