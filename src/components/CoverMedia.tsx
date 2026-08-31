import React from "react";
import { SafeImage } from "@/components/SafeImage";

/** Detect video URLs — extension, data URI, Cloudinary, or stored mime hint. */
export function isVideo(src: string, mimeHint?: string): boolean {
  if (!src) return false;
  if (mimeHint?.startsWith("video/")) return true;
  if (src.startsWith("data:video")) return true;
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(src)) return true;
  if (/res\.cloudinary\.com/i.test(src) && /\/video\/upload\//i.test(src)) return true;
  return false;
}

interface CoverMediaProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: "lazy" | "eager";
  /** When the URL has no extension (e.g. /api/assets/…), use stored mime from the library. */
  mimeHint?: string;
}

export function CoverMedia({
  src,
  alt,
  className,
  style,
  loading = "lazy",
  mimeHint,
}: CoverMediaProps) {
  if (isVideo(src, mimeHint)) {
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        aria-label={alt}
        className={className}
        style={style}
      />
    );
  }
  return <SafeImage src={src} alt={alt} className={className} style={style} loading={loading} />;
}
