/** How many of this image sit in one desktop row: 1 = full width, 2 = half, 3 = third. */
export type GalleryImageColumns = 1 | 2 | 3;

export type GalleryImage = {
  src: string;
  columns?: GalleryImageColumns;
};

/** Legacy gallery JSON stored extra images as URL strings. */
export type GalleryImageEntry = string | GalleryImage;

export function isGalleryImageColumns(value: unknown): value is GalleryImageColumns {
  return value === 1 || value === 2 || value === 3;
}

export function galleryImageSrc(entry: GalleryImageEntry | undefined | null): string {
  if (!entry) return "";
  return typeof entry === "string" ? entry : (entry.src ?? "");
}

/** Existing URL-only images follow the project default, then the historic 2-column layout. */
export function galleryImageColumns(
  entry: GalleryImageEntry | undefined | null,
  fallback: GalleryImageColumns = 2,
): GalleryImageColumns {
  if (entry && typeof entry !== "string" && isGalleryImageColumns(entry.columns)) {
    return entry.columns;
  }
  return isGalleryImageColumns(fallback) ? fallback : 2;
}

export function toGalleryImage(
  entry: GalleryImageEntry,
  fallback: GalleryImageColumns = 2,
): GalleryImage {
  if (typeof entry === "string") return { src: entry, columns: fallback };
  return {
    src: entry.src ?? "",
    columns: isGalleryImageColumns(entry.columns) ? entry.columns : fallback,
  };
}

export function withGalleryImageSrc(
  entry: GalleryImageEntry,
  src: string,
): GalleryImageEntry {
  if (typeof entry === "string") return src;
  return { ...entry, src };
}

export function withGalleryImageColumns(
  entry: GalleryImageEntry,
  columns: GalleryImageColumns,
): GalleryImage {
  return { ...toGalleryImage(entry), columns };
}

/** Tailwind spans on a 6-column desktop grid. Keep class names static for JIT. */
export function galleryImageSpanClass(columns: GalleryImageColumns): string {
  if (columns === 1) return "md:col-span-6";
  if (columns === 3) return "md:col-span-2";
  return "md:col-span-3";
}
