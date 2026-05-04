// Asset storage adapter for the Vercel bundle.
//
// Uploads go to Vercel Blob (when BLOB_READ_WRITE_TOKEN is configured).
// The returned URL is the absolute https blob URL that the frontend can
// drop straight into <img src=...> / coverImage / sections[].src.
//
// If the token is missing the upload fails — we deliberately do not
// fall back to base64-in-Postgres for assets the way the resume does,
// because asset libraries can grow large and would blow Neon's row
// size / table size limits very quickly.

export type StoredAsset = {
  url: string;
};

function makeKey(originalName: string): string {
  const base = (originalName || "asset")
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "asset";
  const ext = (() => {
    const m = /\.([a-z0-9]+)$/i.exec(originalName);
    return m ? m[1]!.toLowerCase() : "bin";
  })();
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `assets/${base}-${stamp}-${rand}.${ext}`;
}

export async function putAsset(
  filenameForKey: string,
  buffer: Buffer,
  mime: string,
): Promise<StoredAsset> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not configured. Create a Vercel Blob store " +
        "(Vercel → Storage → Create → Blob) and add the token to your project's " +
        "environment variables.",
    );
  }
  const { put } = await import("@vercel/blob");
  const key = makeKey(filenameForKey);
  const blob = await put(key, buffer, {
    access: "public",
    contentType: mime,
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60 * 60 * 24 * 30,
  });
  return { url: blob.url };
}

export async function replaceAssetAt(
  url: string,
  buffer: Buffer,
  mime: string,
): Promise<StoredAsset> {
  // Re-upload to the existing key so the public URL stays the same
  // across replaces (Vercel Blob URLs encode the key in the path).
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured.");
  }
  const { put } = await import("@vercel/blob");
  // Strip the absolute prefix so we re-`put` to the same key. Blob URLs
  // look like `https://<store>.public.blob.vercel-storage.com/<key>`.
  const key = (() => {
    try {
      const u = new URL(url);
      return u.pathname.replace(/^\/+/, "");
    } catch {
      return url.replace(/^\/+/, "");
    }
  })();
  const blob = await put(key, buffer, {
    access: "public",
    contentType: mime,
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60 * 60 * 24 * 30,
  });
  return { url: blob.url };
}

export async function deleteAsset(url: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    const { del } = await import("@vercel/blob");
    await del(url);
  } catch {
    // Best-effort — orphaned blobs are tolerable, broken admin UIs are not.
  }
}
