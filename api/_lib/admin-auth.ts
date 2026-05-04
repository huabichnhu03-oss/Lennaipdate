import crypto from "crypto";

// 30-day token lifetime. Long enough that the editor stays signed in
// across a normal week, short enough that a leaked token expires.
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export class AdminConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminConfigError";
  }
}

// Fail closed if either secret is missing. We never fall back to a
// hardcoded password or derive the token-signing secret from the
// password — both would make the admin trivially guessable on a fresh
// deploy where the user forgot to set the env vars.
function requireSecret(name: "ADMIN_PASSWORD" | "ADMIN_TOKEN_SECRET"): string {
  const v = process.env[name];
  if (!v || v.length < 8) {
    throw new AdminConfigError(
      `${name} is not configured (must be at least 8 characters). ` +
        "Set it in Vercel → Project → Settings → Environment Variables, then redeploy.",
    );
  }
  return v;
}

export function getAdminPassword(): string {
  return requireSecret("ADMIN_PASSWORD");
}

function getTokenSecret(): string {
  return requireSecret("ADMIN_TOKEN_SECRET");
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getTokenSecret()).update(payload).digest("base64url");
}

export function issueAdminToken(): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `admin.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token: unknown): boolean {
  if (typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [scope, expStr, sig] = parts;
  if (scope !== "admin" || !expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  let expected: string;
  try {
    expected = sign(`${scope}.${expStr}`);
  } catch {
    return false;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isAdminRequest(body: { token?: unknown; password?: unknown }): boolean {
  if (verifyAdminToken(body.token)) return true;
  if (typeof body.password === "string") {
    try {
      if (body.password === getAdminPassword()) return true;
    } catch {
      return false;
    }
  }
  return false;
}
