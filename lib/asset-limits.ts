/** Shared upload size limits for images and videos. */
export const MAX_IMAGE_ASSET_BYTES = 4 * 1024 * 1024;
export const MAX_VIDEO_ASSET_BYTES = 20 * 1024 * 1024;

/** @deprecated Use maxAssetBytesForMime — kept for image-only flows (gallery shrink, etc.). */
export const MAX_ASSET_BYTES = MAX_IMAGE_ASSET_BYTES;

export function maxAssetBytesForMime(mime: string): number {
  return mime.startsWith("video/") ? MAX_VIDEO_ASSET_BYTES : MAX_IMAGE_ASSET_BYTES;
}

export function maxAssetBytesForFileType(type: string): number {
  return type.startsWith("video/") ? MAX_VIDEO_ASSET_BYTES : MAX_IMAGE_ASSET_BYTES;
}

export function formatMaxMb(bytes: number): number {
  return Math.floor(bytes / 1024 / 1024);
}
