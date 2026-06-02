import type { VercelRequest, VercelResponse } from "@vercel/node";
import { AdminConfigError, getAdminPassword, issueAdminToken } from "../../lib/admin-auth.js";

// Simple in-memory rate limiter: max 5 failed attempts per IP per 15 minutes
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_RATE_LIMIT_MAX = 5;
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60_000;

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= LOGIN_RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const clientIp =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? "unknown";
  if (!checkLoginRateLimit(clientIp)) {
    res.status(429).json({ error: "Too many login attempts. Please try again later." });
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
      res.status(503).json({ error: "Admin authentication is not configured." });
      return;
    }
    throw err;
  }
}
