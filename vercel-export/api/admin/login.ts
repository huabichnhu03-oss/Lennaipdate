import type { VercelRequest, VercelResponse } from "@vercel/node";
import { AdminConfigError, getAdminPassword, issueAdminToken } from "../../lib/admin-auth.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const raw: Record<string, unknown> =
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? (req.body as Record<string, unknown>)
      : {};
  const password = raw.password;
  try {
    if (typeof password !== "string" || password !== getAdminPassword()) {
      res.status(401).json({ error: "Incorrect password" });
      return;
    }
    res.json({ token: issueAdminToken() });
  } catch (err) {
    if (err instanceof AdminConfigError) {
      console.error("[admin] login blocked — missing config:", err.message);
      res.status(503).json({ error: err.message });
      return;
    }
    throw err;
  }
}
