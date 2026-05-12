import fs from "fs";
import path from "path";

const ASSETS_DIR = process.env.ASSETS_DIR ?? path.join(process.cwd(), "data", "assets");

function ensureAssetsDir(): void {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }
}

function makeFilename(originalName: string, ext?: string): string {
  const baseExt = ext ?? ((/\.([a-z0-9]+)$/i.exec(originalName))?.[1] ?? "bin");
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${stamp}-${rand}.${baseExt.toLowerCase()}`;
}

function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

async function uploadToCloudinary(buffer: Buffer, filename: string, mime: string): Promise<string> {
  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const resourceType = mime.startsWith("video/") ? "video" : "image";

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, use_filename: false, unique_filename: true },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error("Cloudinary upload returned no result"));
        }
      },
    );
    uploadStream.end(buffer);
  });
}

/**
 * Store an asset buffer and return the public URL.
 *
 * When CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are
 * all set, the file is uploaded to Cloudinary and its HTTPS URL is returned.
 * Otherwise, the file is written to the local ASSETS_DIR and a relative
 * `/api/assets/:filename` URL is returned (existing local-dev behaviour).
 */
export async function storeAsset(
  buffer: Buffer,
  filename: string,
  mime: string,
): Promise<string> {
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(buffer, filename, mime);
  }

  ensureAssetsDir();
  const ext = (/\.([a-z0-9]+)$/i.exec(filename))?.[1];
  const fname = makeFilename(filename, ext);
  const fpath = path.join(ASSETS_DIR, fname);
  fs.writeFileSync(fpath, buffer);
  return `/api/assets/${fname}`;
}

/**
 * Replace an existing asset and return the new public URL.
 *
 * For Cloudinary: uploads as a new asset (Cloudinary does not support in-place
 * replacement via URL), returning the new secure URL.
 * For local: overwrites the file at the path derived from the old URL and returns
 * the same relative URL (preserving the existing filename).
 */
export async function replaceStoredAsset(
  buffer: Buffer,
  oldUrl: string,
  mime: string,
): Promise<string> {
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(buffer, path.basename(oldUrl), mime);
  }

  ensureAssetsDir();
  const fname = path.basename(oldUrl);
  const fpath = path.join(ASSETS_DIR, fname);
  fs.writeFileSync(fpath, buffer);
  return oldUrl;
}
