import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ALLOWED_SECTIONS, validateSection, setSection } from "../../../lib/content-store.js";
import { isAdminRequest } from "../../../lib/admin-auth.js";

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
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const raw: Record<string, unknown> =
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? (req.body as Record<string, unknown>)
      : {};
  if (!isAdminRequest({ token: readToken(req), ...raw })) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const data = raw.data;
  if (typeof data !== "object" || data === null) {
    res.status(400).json({ error: "Missing or invalid data field" });
    return;
  }
  const saved: string[] = [];
  try {
    for (const section of ALLOWED_SECTIONS) {
      if (section in data) {
        const sectionData = (data as Record<string, unknown>)[section];
        const validationError = validateSection(section, sectionData);
        if (validationError) {
          res.status(400).json({ error: validationError, section, saved });
          return;
        }
        await setSection(section, sectionData);
        saved.push(section);
      }
    }
    res.json({ ok: true, saved });
  } catch (err) {
    console.error("[admin] bulk write failed", err);
    res.status(500).json({ error: "Failed to save content", saved });
  }
}
