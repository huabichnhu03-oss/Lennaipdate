import { put } from "@vercel/blob";
import { query } from "./db.js";

const RESUME_BLOB_KEY = "resume/Lenna_Hua_Resume.pdf";
const RESUME_DB_SECTION = "files_blob_resume";

export type StoredResume = {
  url: string;
  filename: string;
  updatedAt: string;
};

export async function saveResume(buf: Buffer, userFilename: string): Promise<StoredResume> {
  const blob = await put(RESUME_BLOB_KEY, buf, {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: false,
  });
  const updatedAt = new Date().toISOString();
  await query(
    `INSERT INTO content_sections (name, data, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [RESUME_DB_SECTION, JSON.stringify({ filename: userFilename, url: blob.url, updatedAt })],
  );
  return { url: blob.url, filename: userFilename, updatedAt };
}

export type ResumeBlob = {
  buffer: Buffer;
  contentType: string;
  filename: string;
} | null;

export async function readResumeBlob(): Promise<ResumeBlob> {
  try {
    const rows = await query<{ data: { filename?: string; url?: string } }>(
      "SELECT data FROM content_sections WHERE name = $1",
      [RESUME_DB_SECTION],
    );
    if (rows.length === 0 || !rows[0]?.data?.url) return null;
    const { url, filename = "Lenna_Hua_Resume.pdf" } = rows[0].data;
    const response = await fetch(url!);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: "application/pdf",
      filename,
    };
  } catch {
    return null;
  }
}
