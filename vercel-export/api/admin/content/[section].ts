import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isAllowedSection, validateSection, setSection, ALLOWED_SECTIONS } from "../../../lib/content-store.js";
import { isAdminRequest } from "../../../lib/admin-auth.js";

function readToken(req: VercelRequest): string | undefined {
  const h = req.headers["authorization"];
  if (typeof h === "string" && h.toLowerCase().startsWith("bearer ")) {
    return h.slice(7).trim();
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  if (typeof body.token === "string") return body.token;
  const q = (req.query ?? {}) as Record<string, unknown>;
  if (typeof q.token === "string") return q.token as string;
  return undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "POST") {
    const section = req.query["section"] as string;
    if (!isAllowedSection(section)) {
      res.status(400).json({ error: "Unknown section" });
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
    if (data === undefined) {
      res.status(400).json({ error: "Missing data field" });
      return;
    }
    const validationError = validateSection(section, data);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }
    try {
      await setSection(section, data);
      res.json({ ok: true, section });
    } catch (err) {
      console.error("[admin] write failed", err);
      res.status(500).json({ error: "Failed to save section" });
    }
    return;
  }

  if (req.method === "GET") {
    const raw: Record<string, unknown> = {};
    raw.token = readToken(req);
    if (!isAdminRequest(raw)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const section = req.query["section"] as string;
    if (!isAllowedSection(section)) {
      res.status(400).json({ error: "Unknown section" });
      return;
    }
    const { getSection } = await import("../../../lib/content-store.js");
    try {
      const data = await getSection(section);
      res.json(data);
    } catch (err) {
      console.error("[admin] read failed", err);
      res.status(500).json({ error: "Failed to load section" });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
