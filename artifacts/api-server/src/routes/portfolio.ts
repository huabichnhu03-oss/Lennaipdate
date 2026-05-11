import { Router, type Request, type ErrorRequestHandler, type RequestHandler } from "express";
import multer from "multer";
import { Resend } from "resend";
import {
  ALLOWED_SECTIONS,
  validateSection,
  getAllSections,
  getSection,
  isAllowedSection,
  setSection,
} from "../lib/content-store.js";
import {
  AdminConfigError,
  getAdminPassword,
  isAdminRequest,
  issueAdminToken,
} from "../lib/admin-auth.js";
import { saveResume, readResumeBlob } from "../lib/resume-storage.js";
import {
  deleteMessage as deleteContactMessage,
  insertMessage as insertContactMessage,
  listMessages as listContactMessages,
  setMessageRead as setContactMessageRead,
} from "../lib/messages-store.js";
import {
  listAssets,
  uploadAsset,
  renameAsset,
  removeAsset,
  replaceAsset,
  getAssetFilePath,
} from "../lib/assets-store.js";
import fs from "fs";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Health ────────────────────────────────────────────────────────────
router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// ── Public content reads ───────────────────────────────────────────────
router.get("/content", async (_req, res) => {
  try {
    const all = await getAllSections();
    res.json(all);
  } catch (err) {
    console.error("[content] read-all failed", err);
    res.status(500).json({ error: "Failed to load content" });
  }
});

router.get("/content/:section", async (req, res) => {
  const section = req.params.section;
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
});

// ── Serve local assets ────────────────────────────────────────────────
router.get("/assets/:filename", (req, res) => {
  const fpath = getAssetFilePath(req.params.filename ?? "");
  if (!fpath) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }
  res.sendFile(fpath);
});

// ── Admin login ───────────────────────────────────────────────────────
router.post("/admin/login", (req, res) => {
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
});

// ── Admin writes ──────────────────────────────────────────────────────
router.post("/admin/content/:section", async (req, res) => {
  const section = req.params.section;
  if (!isAllowedSection(section)) {
    res.status(400).json({ error: "Unknown section" });
    return;
  }
  const raw: Record<string, unknown> =
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? (req.body as Record<string, unknown>)
      : {};
  if (!isAdminRequest(raw)) {
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
});

router.post("/admin/content", async (req, res) => {
  const raw: Record<string, unknown> =
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? (req.body as Record<string, unknown>)
      : {};
  if (!isAdminRequest(raw)) {
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
});

// ── Resume upload ─────────────────────────────────────────────────────
router.post("/admin/resume", async (req, res) => {
  const raw: Record<string, unknown> =
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? (req.body as Record<string, unknown>)
      : {};
  if (!isAdminRequest(raw)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const dataUrl = raw.dataUrl;
  const filenameRaw = raw.filename;
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:application/pdf")) {
    res.status(400).json({ error: "Expected a PDF file (data URL)." });
    return;
  }
  const commaIdx = dataUrl.indexOf(",");
  const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : "";
  const buf = Buffer.from(base64, "base64");
  if (buf.length === 0) {
    res.status(400).json({ error: "Uploaded file is empty." });
    return;
  }
  if (buf.length > 10 * 1024 * 1024) {
    res.status(413).json({ error: "Resume PDF must be 10 MB or smaller." });
    return;
  }
  if (buf.slice(0, 5).toString("ascii") !== "%PDF-") {
    res.status(400).json({ error: "File does not look like a valid PDF." });
    return;
  }
  const userFilename =
    typeof filenameRaw === "string" && filenameRaw.trim().toLowerCase().endsWith(".pdf")
      ? filenameRaw.trim().slice(-120)
      : "Lenna_Hua_Resume.pdf";
  try {
    const stored = await saveResume(buf, userFilename);
    res.json({ ok: true, ...stored });
  } catch (err) {
    console.error("[admin] resume upload failed", err);
    res.status(500).json({ error: "Failed to store the resume." });
  }
});

router.get("/files/resume.pdf", async (_req, res) => {
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
});

// ── Contact form ──────────────────────────────────────────────────────
router.post("/contact", async (req, res) => {
  const raw: Record<string, unknown> =
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? (req.body as Record<string, unknown>)
      : {};

  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  const message = typeof raw.message === "string" ? raw.message.trim() : "";

  if (!name || !email || !message) {
    res.status(400).json({ error: "Name, email, and message are all required." });
    return;
  }
  if (name.length > 200) {
    res.status(400).json({ error: "Name is too long (max 200 characters)." });
    return;
  }
  if (!EMAIL_RE.test(email) || email.length > 320) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }
  if (message.length > 5000) {
    res.status(400).json({ error: "Message is too long (max 5000 characters)." });
    return;
  }

  const ipRaw = (req.headers["x-forwarded-for"] as string | undefined)
    ?.split(",")[0]
    ?.trim() ?? req.ip ?? null;
  const userAgent = (req.headers["user-agent"] as string | undefined) ?? null;

  try {
    await insertContactMessage({
      name,
      email,
      message,
      ip: ipRaw || null,
      userAgent,
    });
  } catch (err) {
    console.error("[contact] failed to persist message", err);
    res.status(500).json({ error: "Could not save your message. Please try again." });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[contact] RESEND_API_KEY missing — saved to inbox, email skipped");
    res.json({ ok: true });
    return;
  }

  const resend = new Resend(apiKey);
  const to = process.env.CONTACT_TO_EMAIL || "lenna.huawork@gmail.com";

  const { error } = await resend.emails.send({
    from: "Lenna Portfolio <onboarding@resend.dev>",
    to: [to],
    replyTo: email,
    subject: `Portfolio contact from ${name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#1F67F1;margin-bottom:4px">New message from your portfolio</h2>
        <hr style="border:1px solid #eee"/>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
        <p><strong>Message:</strong></p>
        <blockquote style="border-left:3px solid #1F67F1;padding-left:12px;color:#444;white-space:pre-wrap">${escapeHtml(message)}</blockquote>
      </div>
    `,
    text: `New message from your portfolio\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n`,
  });

  if (error) {
    console.error("[contact] Resend failed (message saved to inbox)", error);
    res.json({ ok: true });
    return;
  }

  res.json({ ok: true });
});

// ── Admin inbox ───────────────────────────────────────────────────────
const readAdminToken = (req: Request): string | undefined => {
  const h = req.headers["authorization"];
  if (typeof h === "string" && h.toLowerCase().startsWith("bearer ")) {
    return h.slice(7).trim();
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  if (typeof body.token === "string") return body.token;
  const q = (req.query ?? {}) as Record<string, unknown>;
  if (typeof q.token === "string") return q.token as string;
  return undefined;
};
const requireAdmin = (req: Request): boolean =>
  isAdminRequest({ token: readAdminToken(req) });

router.get("/admin/messages", async (req, res) => {
  if (!requireAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const messages = await listContactMessages();
    res.json({ messages });
  } catch (err) {
    console.error("[admin] list messages failed", err);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

router.post("/admin/messages/:id/read", async (req, res) => {
  if (!requireAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const id = req.params.id;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const read = body.read !== false;
  try {
    const updated = await setContactMessageRead(id, Boolean(read));
    if (!updated) {
      res.status(404).json({ error: "Message not found" });
      return;
    }
    res.json({ ok: true, message: updated });
  } catch (err) {
    console.error("[admin] update message failed", err);
    res.status(500).json({ error: "Failed to update message" });
  }
});

router.post("/admin/messages/:id/delete", async (req, res) => {
  if (!requireAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const id = req.params.id;
  try {
    const removed = await deleteContactMessage(id);
    if (!removed) {
      res.status(404).json({ error: "Message not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[admin] delete message failed", err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// ── Admin assets ──────────────────────────────────────────────────────
const MAX_ASSET_BYTES = 4 * 1024 * 1024;
const isAllowedAssetMime = (mime: string): boolean =>
  mime.startsWith("image/") || mime.startsWith("video/");

const assetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ASSET_BYTES },
});

const multerErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({
        error: `File is too large (max ${Math.floor(MAX_ASSET_BYTES / 1024 / 1024)} MB).`,
      });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }
  next(err);
};

const parseAssetDataUrl = (s: string): { mime: string; buffer: Buffer } | null => {
  const m = /^data:([^;,]+)(?:;charset=[^;,]+)?(?:;base64)?,(.*)$/i.exec(s);
  if (!m) return null;
  const mime = m[1]!.toLowerCase();
  const isBase64 = /;base64,/i.test(s.slice(0, s.indexOf(",") + 1));
  const data = m[2]!;
  try {
    const buf = isBase64
      ? Buffer.from(data, "base64")
      : Buffer.from(decodeURIComponent(data), "utf8");
    return { mime, buffer: buf };
  } catch {
    return null;
  }
};

const intField = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.round(n);
  }
  return null;
};

type AssetPayload = {
  buffer: Buffer;
  mime: string;
  filename: string;
  width: number | null;
  height: number | null;
};

const readAssetUploadPayload = (
  req: Request,
): AssetPayload | { error: string; status: number } => {
  const file = (req as unknown as { file?: Express.Multer.File }).file;
  const body = (req.body ?? {}) as Record<string, unknown>;
  if (file) {
    if (!isAllowedAssetMime(file.mimetype)) {
      return { error: `Unsupported file type: ${file.mimetype}`, status: 400 };
    }
    if (file.size === 0) return { error: "Uploaded file is empty.", status: 400 };
    return {
      buffer: file.buffer,
      mime: file.mimetype.toLowerCase(),
      filename:
        (typeof body.filename === "string" && body.filename) ||
        file.originalname ||
        "upload",
      width: intField(body.width),
      height: intField(body.height),
    };
  }
  const dataUrl = body.dataUrl;
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return {
      error: "Expected a multipart upload with a `file` field, or a JSON body with `dataUrl`.",
      status: 400,
    };
  }
  const parsed = parseAssetDataUrl(dataUrl);
  if (!parsed) return { error: "Could not decode upload.", status: 400 };
  if (!isAllowedAssetMime(parsed.mime)) {
    return { error: `Unsupported file type: ${parsed.mime}`, status: 400 };
  }
  if (parsed.buffer.length === 0) {
    return { error: "Uploaded file is empty.", status: 400 };
  }
  if (parsed.buffer.length > MAX_ASSET_BYTES) {
    return {
      error: `File is too large (max ${Math.floor(MAX_ASSET_BYTES / 1024 / 1024)} MB).`,
      status: 413,
    };
  }
  return {
    buffer: parsed.buffer,
    mime: parsed.mime,
    filename: typeof body.filename === "string" ? body.filename : "upload",
    width: intField(body.width),
    height: intField(body.height),
  };
};

router.get("/admin/assets", async (req, res) => {
  if (!requireAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const q = req.query as Record<string, string | undefined>;
  const limit = q.limit ? Number(q.limit) : undefined;
  const offset = q.offset ? Number(q.offset) : undefined;
  const t = q.type;
  const type = (t === "image" || t === "gif" || t === "video" ? t : "all") as
    | "image"
    | "gif"
    | "video"
    | "all";
  try {
    const out = await listAssets({ limit, offset, type, search: q.search });
    res.json(out);
  } catch (err) {
    console.error("[admin] list assets failed", err);
    res.status(500).json({ error: "Failed to load assets" });
  }
});

const uploadAssetHandler: RequestHandler = async (req, res) => {
  if (!requireAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const payload = readAssetUploadPayload(req);
  if ("error" in payload) {
    res.status(payload.status).json({ error: payload.error });
    return;
  }
  try {
    const asset = await uploadAsset(payload);
    res.json({ ok: true, asset });
  } catch (err) {
    console.error("[admin] upload asset failed", err);
    const message = err instanceof Error ? err.message : "Failed to store asset";
    res.status(500).json({ error: message });
  }
};

router.post(
  "/admin/assets/upload",
  assetUpload.single("file"),
  multerErrorHandler,
  uploadAssetHandler,
);

const replaceAssetHandler: RequestHandler = async (req, res) => {
  if (!requireAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const payload = readAssetUploadPayload(req);
  if ("error" in payload) {
    res.status(payload.status).json({ error: payload.error });
    return;
  }
  try {
    const updated = await replaceAsset(String(req.params["id"]), {
      buffer: payload.buffer,
      mime: payload.mime,
      width: payload.width,
      height: payload.height,
    });
    if (!updated) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }
    res.json({ ok: true, asset: updated });
  } catch (err) {
    console.error("[admin] replace asset failed", err);
    const message = err instanceof Error ? err.message : "Failed to replace asset";
    res.status(500).json({ error: message });
  }
};

router.post(
  "/admin/assets/:id/replace",
  assetUpload.single("file"),
  multerErrorHandler,
  replaceAssetHandler,
);

router.post("/admin/assets/:id/rename", async (req, res) => {
  if (!requireAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const filename = typeof body.filename === "string" ? body.filename : "";
  if (!filename.trim()) {
    res.status(400).json({ error: "Filename cannot be empty." });
    return;
  }
  try {
    const updated = await renameAsset(req.params.id!, filename);
    if (!updated) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }
    res.json({ ok: true, asset: updated });
  } catch (err) {
    console.error("[admin] rename asset failed", err);
    res.status(500).json({ error: "Failed to rename asset" });
  }
});

router.post("/admin/assets/:id/delete", async (req, res) => {
  if (!requireAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const removed = await removeAsset(req.params.id!);
    if (!removed) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[admin] delete asset failed", err);
    res.status(500).json({ error: "Failed to delete asset" });
  }
});

export default router;
