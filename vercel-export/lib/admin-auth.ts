import crypto from "crypto";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export class AdminConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminConfigError";
  }
}

function requireSecret(name: "ADMIN_PASSWORD" | "ADMIN_TOKEN_SECRET"): string {
  const v = process.env[name];
  if (!v || v.length < 8) {
    throw new AdminConfigError(
      `${name} is not configured (must be at least 8 characters). ` +
        "Set it in your Vercel environment variables.",
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
