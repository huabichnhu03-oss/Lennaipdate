import React from "react";
import { SafeImage } from "@/components/SafeImage";

export function isVideo(src: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src) || src.startsWith("data:video");
}

interface CoverMediaProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export function CoverMedia({ src, alt, className, style }: CoverMediaProps) {
  if (isVideo(src)) {
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className={className}
        style={style}
      />
    );
  }
  return <SafeImage src={src} alt={alt} className={className} style={style} />;
}
