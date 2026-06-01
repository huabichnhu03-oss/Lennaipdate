/**
 * Smoke-test video upload against a running deployment.
 * Usage (PowerShell):
 *   $env:ADMIN_PASSWORD="your-admin-password"
 *   $env:API_BASE="https://www.lennahua.ca"
 *   node scripts/test-video-upload.mjs
 */
import fs from "fs";
import path from "path";
import os from "os";

const API_BASE = (process.env.API_BASE ?? "https://www.lennahua.ca").replace(/\/$/, "");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Minimal valid MP4 (ftyp + empty mdat) — well under 4 MB upload cap.
const MINI_MP4_B64 =
  "AAAAHGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAA" +
  "AhtkYXRhAAAA";

function miniMp4Path() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lenna-video-test-"));
  const file = path.join(dir, "test-cover.mp4");
  fs.writeFileSync(file, Buffer.from(MINI_MP4_B64, "base64"));
  return { file, dir };
}

async function login() {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.token) {
    throw new Error(body.error ?? `Login failed (${res.status})`);
  }
  return body.token;
}

async function uploadVideo(token, filePath) {
  const buf = fs.readFileSync(filePath);
  const fd = new FormData();
  fd.append("token", token);
  fd.append("filename", "test-cover.mp4");
  fd.append("file", new Blob([buf], { type: "video/mp4" }), "test-cover.mp4");

  const res = await fetch(`${API_BASE}/api/admin/assets/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.asset?.url) {
    throw new Error(body.error ?? `Upload failed (${res.status})`);
  }
  return body.asset;
}

async function probeAssetUrl(assetUrl) {
  const url = assetUrl.startsWith("http")
    ? assetUrl
    : `${API_BASE}${assetUrl.startsWith("/") ? "" : "/"}${assetUrl}`;
  const res = await fetch(url, { method: "HEAD" });
  return {
    url,
    status: res.status,
    contentType: res.headers.get("content-type"),
  };
}

async function main() {
  if (!ADMIN_PASSWORD) {
    console.error("Set ADMIN_PASSWORD to run authenticated upload test.");
    process.exit(1);
  }

  const { file, dir } = miniMp4Path();
  try {
    console.log("API:", API_BASE);
    const token = await login();
    console.log("Login: ok");

    const asset = await uploadVideo(token, file);
    console.log("Upload: ok", { id: asset.id, mime: asset.mime, url: asset.url });

    const probe = await probeAssetUrl(asset.url);
    console.log("Serve:", probe);

    if (probe.status !== 200) {
      throw new Error(`Asset URL returned ${probe.status}`);
    }
    if (!probe.contentType?.startsWith("video/")) {
      throw new Error(`Expected video/* content-type, got ${probe.contentType}`);
    }
    console.log("Video upload pipeline: PASS");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("Video upload pipeline: FAIL");
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
