import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isAdminRequest } from "../../../../lib/admin-auth.js";
import { deleteMessage } from "../../../../lib/messages-store.js";

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
  const id = req.query["id"] as string;
  try {
    const removed = await deleteMessage(id);
    if (!removed) {
      res.status(404).json({ error: "Message not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[admin] delete message failed", err);
    res.status(500).json({ error: "Failed to delete message" });
  }
}
