import fs from "fs";
import path from "path";
import { query } from "./db.js";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const RESUME_PATH = path.join(DATA_DIR, "resume.pdf");
const RESUME_DB_SECTION = "files_blob_resume";

export type StoredResume = {
  url: string;
  filename: string;
  updatedAt: string;
};

export async function saveResume(buf: Buffer, userFilename: string): Promise<StoredResume> {
  // Ensure data dir exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(RESUME_PATH, buf);
  const updatedAt = new Date().toISOString();
  // Save metadata to DB
  await query(
    `INSERT INTO content_sections (name, data, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [RESUME_DB_SECTION, JSON.stringify({ filename: userFilename, updatedAt })],
  );
  return { url: "/api/files/resume.pdf", filename: userFilename, updatedAt };
}

export type ResumeBlob = {
  buffer: Buffer;
  contentType: string;
  filename: string;
} | null;

export async function readResumeBlob(): Promise<ResumeBlob> {
  // Check if file exists on disk first
  if (fs.existsSync(RESUME_PATH)) {
    let filename = "Lenna_Hua_Resume.pdf";
    try {
      const rows = await query<{ data: { filename?: string } }>(
        "SELECT data FROM content_sections WHERE name = $1",
        [RESUME_DB_SECTION],
      );
      if (rows.length > 0 && rows[0]?.data?.filename) {
        filename = rows[0].data.filename;
      }
    } catch {
      /* use default */
    }
    return {
      buffer: fs.readFileSync(RESUME_PATH),
      contentType: "application/pdf",
      filename,
    };
  }
  // Check for public directory fallback
  const publicPath = path.join(process.cwd(), "..", "lenna-portfolio", "public", "Lenna_Hua_Resume.pdf");
  if (fs.existsSync(publicPath)) {
    return {
      buffer: fs.readFileSync(publicPath),
      contentType: "application/pdf",
      filename: "Lenna_Hua_Resume.pdf",
    };
  }
  return null;
}
