import type { VercelRequest, VercelResponse } from "@vercel/node";
import formidable from "formidable";
import fs from "fs";
import { isAdminRequest } from "../../../lib/admin-auth.js";
import { uploadAsset } from "../../../lib/assets-store.js";

export const config = { api: { bodyParser: false } };

const MAX_ASSET_BYTES = 4 * 1024 * 1024;

const isAllowedAssetMime = (mime: string): boolean =>
  mime.startsWith("image/") || mime.startsWith("video/");

const intField = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.round(n);
  }
  return null;
};

function parseMultipart(req: VercelRequest): Promise<{
  fields: formidable.Fields;
  files: formidable.Files;
}> {
  return new Promise((resolve, reject) => {
    const form = formidable({ maxFileSize: MAX_ASSET_BYTES });
    form.parse(req as unknown as Parameters<typeof form.parse>[0], (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

function firstStr(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const contentType = req.headers["content-type"] ?? "";

  if (contentType.includes("multipart/form-data")) {
    let parsed: { fields: formidable.Fields; files: formidable.Files };
    try {
      parsed = await parseMultipart(req);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload parse failed";
      const isTooBig = msg.toLowerCase().includes("maxfilesize") || msg.toLowerCase().includes("too large");
      res.status(isTooBig ? 413 : 400).json({ error: isTooBig ? `File is too large (max ${Math.floor(MAX_ASSET_BYTES / 1024 / 1024)} MB).` : msg });
      return;
    }

    const token = firstStr(parsed.fields["token"]);
    if (!isAdminRequest({ token })) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const fileEntry = parsed.files["file"];
    const file = Array.isArray(fileEntry) ? fileEntry[0] : fileEntry;
    if (!file) {
      res.status(400).json({ error: "No file uploaded." });
      return;
    }

    const mime = (file.mimetype ?? "").toLowerCase();
    if (!isAllowedAssetMime(mime)) {
      res.status(400).json({ error: `Unsupported file type: ${mime}` });
      return;
    }
    if ((file.size ?? 0) === 0) {
      res.status(400).json({ error: "Uploaded file is empty." });
      return;
    }

    let buffer: Buffer;
    try {
      buffer = fs.readFileSync(file.filepath);
    } catch {
      res.status(500).json({ error: "Failed to read uploaded file." });
      return;
    }

    try {
      const asset = await uploadAsset({
        buffer,
        mime,
        filename: firstStr(parsed.fields["filename"]) || file.originalFilename || "upload",
        width: intField(firstStr(parsed.fields["width"])),
        height: intField(firstStr(parsed.fields["height"])),
      });
      res.json({ ok: true, asset });
    } catch (err) {
      console.error("[admin] upload asset failed", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Failed to store asset" });
    }
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const tokenVal = req.headers["authorization"]?.startsWith("Bearer ")
    ? req.headers["authorization"].slice(7)
    : (typeof body.token === "string" ? body.token : "");
  if (!isAdminRequest({ token: tokenVal })) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const dataUrl = body.dataUrl;
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    res.status(400).json({ error: "Expected multipart/form-data with a `file` field, or JSON with `dataUrl`." });
    return;
  }
  const m = /^data:([^;,]+)(?:;charset=[^;,]+)?(?:;base64)?,(.*)$/i.exec(dataUrl);
  if (!m) { res.status(400).json({ error: "Could not decode upload." }); return; }
  const mime = m[1]!.toLowerCase();
  const isBase64 = /;base64,/i.test(dataUrl.slice(0, dataUrl.indexOf(",") + 1));
  const buffer = isBase64 ? Buffer.from(m[2]!, "base64") : Buffer.from(decodeURIComponent(m[2]!), "utf8");
  if (!isAllowedAssetMime(mime)) { res.status(400).json({ error: `Unsupported file type: ${mime}` }); return; }
  if (buffer.length === 0) { res.status(400).json({ error: "Uploaded file is empty." }); return; }
  if (buffer.length > MAX_ASSET_BYTES) { res.status(413).json({ error: `File is too large (max ${Math.floor(MAX_ASSET_BYTES / 1024 / 1024)} MB).` }); return; }

  try {
    const asset = await uploadAsset({
      buffer,
      mime,
      filename: typeof body.filename === "string" ? body.filename : "upload",
      width: intField(body.width),
      height: intField(body.height),
    });
    res.json({ ok: true, asset });
  } catch (err) {
    console.error("[admin] upload asset failed", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to store asset" });
  }
}
