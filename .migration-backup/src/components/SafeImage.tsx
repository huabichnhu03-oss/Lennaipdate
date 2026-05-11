import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BRAND } from "@/lib/brand";

type SafeImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallbackAspect?: string;
  fallbackCaption?: string;
};

export function SafeImage({
  src,
  alt,
  className,
  style,
  fallbackAspect,
  fallbackCaption,
  onError,
  ...rest
}: SafeImageProps) {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (!src || errored) {
    return (
      <DinoFallback
        alt={alt}
        className={className}
        style={style}
        aspect={fallbackAspect}
        caption={fallbackCaption}
      />
    );
  }

  return (
    <img
      {...rest}
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={(e) => {
        setErrored(true);
        onError?.(e);
      }}
    />
  );
}

type DinoFallbackProps = {
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  aspect?: string;
  caption?: string;
};

export function DinoFallback({
  alt,
  className,
  style,
  aspect,
  caption,
}: DinoFallbackProps) {
  const reduce = useReducedMotion();
  const label = caption ?? "Under construction";
  const ariaLabel = alt
    ? `${alt} — image unavailable, under construction`
    : "Image unavailable, under construction";

  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={className}
      style={{
        ...style,
        aspectRatio: aspect ?? style?.aspectRatio ?? "16 / 5",
        background:
          "linear-gradient(135deg, var(--color-card, #1c1a18) 0%, var(--color-background, #0d0c0b) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Soft grid texture */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          width: "min(60%, 220px)",
          maxHeight: "88%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <svg
          viewBox="0 0 240 160"
          width="100%"
          aria-hidden="true"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block", maxHeight: "64px", height: "auto" }}
        >
          {/* Ground line */}
          <line
            x1="10"
            y1="138"
            x2="230"
            y2="138"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Sign post */}
          <rect x="146" y="64" width="4" height="74" fill="rgba(255,255,255,0.5)" />
          <rect x="178" y="64" width="4" height="74" fill="rgba(255,255,255,0.5)" />

          {/* Sign board */}
          <g>
            <motion.g
              initial={{ rotate: 0 }}
              animate={reduce ? undefined : { rotate: [-1.4, 1.4, -1.4] }}
              transition={
                reduce
                  ? undefined
                  : { duration: 3.6, ease: "easeInOut", repeat: Infinity }
              }
              style={{ transformOrigin: "164px 78px" }}
            >
              <rect
                x="116"
                y="48"
                width="96"
                height="36"
                rx="3"
                fill={BRAND.blue}
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="1.5"
              />
              <text
                x="164"
                y="65"
                textAnchor="middle"
                fontFamily="ui-monospace, Menlo, monospace"
                fontSize="9"
                fontWeight="700"
                fill="#FFFFFF"
                letterSpacing="1.2"
              >
                UNDER
              </text>
              <text
                x="164"
                y="78"
                textAnchor="middle"
                fontFamily="ui-monospace, Menlo, monospace"
                fontSize="9"
                fontWeight="700"
                fill="#FFFFFF"
                letterSpacing="1.2"
              >
                CONSTRUCTION
              </text>
            </motion.g>
          </g>

          {/* Dino — simple cartoon silhouette */}
          <motion.g
            initial={{ y: 0 }}
            animate={reduce ? undefined : { y: [0, -2.5, 0] }}
            transition={
              reduce
                ? undefined
                : { duration: 1.2, ease: "easeInOut", repeat: Infinity }
            }
          >
            {/* Body */}
            <path
              d="M40 130 Q35 100 55 92 Q60 75 78 75 Q92 70 100 80 Q108 90 100 102 L100 130 L92 130 L92 116 L72 116 L72 130 Z"
              fill={BRAND.teal}
              stroke="rgba(0,0,0,0.35)"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            {/* Belly highlight */}
            <path
              d="M70 116 Q72 104 84 102 Q92 102 94 110 L94 116 Z"
              fill="rgba(255,255,255,0.18)"
            />
            {/* Eye */}
            <circle cx="90" cy="83" r="2.2" fill="#0d0c0b" />
            <circle cx="90.6" cy="82.4" r="0.7" fill="#FFFFFF" />
            {/* Spikes */}
            <path
              d="M52 96 L56 90 L60 96 Z M62 92 L66 86 L70 92 Z M72 90 L76 84 L80 90 Z"
              fill={BRAND.coral}
            />
            {/* Tail */}
            <path
              d="M40 130 Q22 122 14 108 Q12 104 18 104 Q28 110 40 118 Z"
              fill={BRAND.teal}
              stroke="rgba(0,0,0,0.35)"
              strokeWidth="1"
              strokeLinejoin="round"
            />

            {/* Hammer arm — swings */}
            <motion.g
              initial={{ rotate: -10 }}
              animate={reduce ? undefined : { rotate: [-22, 18, -22] }}
              transition={
                reduce
                  ? undefined
                  : { duration: 0.9, ease: "easeInOut", repeat: Infinity }
              }
              style={{ transformOrigin: "104px 96px" }}
            >
              <rect
                x="102"
                y="92"
                width="6"
                height="22"
                rx="2"
                fill={BRAND.teal}
                stroke="rgba(0,0,0,0.35)"
                strokeWidth="1"
              />
              {/* Hammer head */}
              <rect
                x="96"
                y="84"
                width="20"
                height="10"
                rx="1.5"
                fill="rgba(255,255,255,0.9)"
                stroke="rgba(0,0,0,0.5)"
                strokeWidth="1"
              />
              <rect x="100" y="83" width="4" height="12" fill="rgba(0,0,0,0.45)" />
            </motion.g>
          </motion.g>

          {/* Sparks / dust */}
          {!reduce && (
            <g>
              <motion.circle
                cx="118"
                cy="86"
                r="1.6"
                fill={BRAND.pink}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], y: [0, -8, -14] }}
                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.3 }}
              />
              <motion.circle
                cx="124"
                cy="90"
                r="1.2"
                fill={BRAND.coral}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], y: [0, -10, -16] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  repeatDelay: 0.4,
                  delay: 0.2,
                }}
              />
              <motion.circle
                cx="112"
                cy="92"
                r="1"
                fill={BRAND.blue}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], y: [0, -6, -12] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  repeatDelay: 0.35,
                  delay: 0.5,
                }}
              />
            </g>
          )}
        </svg>

        <span
          style={{
            fontFamily: "ui-monospace, Menlo, monospace",
            fontSize: "9px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

export default SafeImage;
