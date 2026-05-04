// Resume storage adapter. The same upload endpoint dispatches to one of
// two backends based on env config:
//
//   1. Vercel Blob (preferred) — when BLOB_READ_WRITE_TOKEN is set, the
//      PDF is uploaded to Blob with a stable filename. The returned URL
//      is an absolute https URL hosted by Vercel Blob.
//
//   2. Postgres base64 fallback — when no Blob token is configured, the
//      PDF is stored base64-encoded in the `content_sections` row named
//      "files_blob_resume". The public link goes through
//      `GET /api/files/resume.pdf`, which streams the bytes back.
//
// Both backends preserve a stable public URL so existing links keep
// working across re-uploads.

import { readSection, writeSection } from "./db";

const RESUME_BLOB_KEY = "Lenna_Hua_Resume.pdf";
const RESUME_DB_SECTION = "files_blob_resume";

export type StoredResume = {
  url: string;
  filename: string;
  updatedAt: string;
};

function hasBlobToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function saveResume(
  buf: Buffer,
  userFilename: string,
): Promise<StoredResume> {
  const updatedAt = new Date().toISOString();

  if (hasBlobToken()) {
    const { put } = await import("@vercel/blob");
    // addRandomSuffix:false + allowOverwrite:true keeps the public URL
    // stable across re-uploads so existing inbound links keep resolving
    // to the latest PDF without needing a cache-bust query string.
    const blob = await put(RESUME_BLOB_KEY, buf, {
      access: "public",
      contentType: "application/pdf",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 300,
    });
    return { url: blob.url, filename: userFilename, updatedAt };
  }

  // Fallback: store base64 in the content_sections table and serve it
  // via the GET /api/files/resume.pdf endpoint below.
  await writeSection(RESUME_DB_SECTION, {
    filename: userFilename,
    contentType: "application/pdf",
    base64: buf.toString("base64"),
    updatedAt,
  });
  return { url: "api/files/resume.pdf", filename: userFilename, updatedAt };
}

// Used by the GET /api/files/resume.pdf endpoint. Returns null when no
// resume has been uploaded via the base64 fallback (e.g. fresh install
// or Blob is configured and the bytes live on Blob instead).
export async function readResumeBlob(): Promise<{
  buffer: Buffer;
  filename: string;
  contentType: string;
} | null> {
  const row = (await readSection(RESUME_DB_SECTION)) as
    | {
        filename?: unknown;
        contentType?: unknown;
        base64?: unknown;
      }
    | null;
  if (!row || typeof row.base64 !== "string" || row.base64.length === 0) {
    return null;
  }
  return {
    buffer: Buffer.from(row.base64, "base64"),
    filename: typeof row.filename === "string" ? row.filename : RESUME_BLOB_KEY,
    contentType:
      typeof row.contentType === "string" ? row.contentType : "application/pdf",
  };
}
