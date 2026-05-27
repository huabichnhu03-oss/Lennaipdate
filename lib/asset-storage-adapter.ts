import path from "path";

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

async function uploadToVercelBlob(buffer: Buffer, filename: string, mime: string): Promise<string> {
  const { put } = await import("@vercel/blob");
  const ext = (/\.([a-z0-9]+)$/i.exec(filename))?.[1] ?? "bin";
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  const key = `assets/${stamp}-${rand}.${ext.toLowerCase()}`;
  const blob = await put(key, buffer, { access: "public", contentType: mime });
  return blob.url;
}

/**
 * Store an asset buffer and return the public URL.
 *
 * Priority:
 * 1. Cloudinary — when CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and
 *    CLOUDINARY_API_SECRET are all set.
 * 2. Vercel Blob — fallback when Cloudinary env vars are absent.
 */
export async function storeAsset(
  buffer: Buffer,
  filename: string,
  mime: string,
): Promise<string> {
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(buffer, filename, mime);
  }
  return uploadToVercelBlob(buffer, filename, mime);
}

/**
 * Replace an existing asset and return the new public URL.
 *
 * For Cloudinary: uploads as a new asset and returns the new URL.
 * For Vercel Blob: deletes the old blob then uploads a new one.
 */
export async function replaceStoredAsset(
  buffer: Buffer,
  oldUrl: string,
  mime: string,
): Promise<string> {
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(buffer, path.basename(oldUrl), mime);
  }

  const { put, del } = await import("@vercel/blob");
  try {
    await del(oldUrl);
  } catch {
    /* best-effort — blob may already be gone */
  }
  const ext = (/\.([a-z0-9]+)$/i.exec(oldUrl))?.[1] ?? "bin";
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  const key = `assets/${stamp}-${rand}.${ext.toLowerCase()}`;
  const blob = await put(key, buffer, { access: "public", contentType: mime });
  return blob.url;
}
