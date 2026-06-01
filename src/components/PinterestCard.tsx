import { motion } from "framer-motion";
import { CoverMedia } from "@/components/CoverMedia";
import projectsData from "@/data/projects.json";
import { BRAND_DECK, BRAND_RGB, BRAND_EASE } from "@/lib/brand";

const ACCENTS = BRAND_DECK;
const ACCENT_RGB = BRAND_RGB;

/** Ombre gradient pairs — each card cycles through a different two-tone blend */
const OMBRE_PAIRS: [string, string][] = [
  ["31,103,241", "236,72,153"],   // blue → pink
  ["236,72,153", "232,113,90"],   // pink → coral
  ["232,113,90", "109,184,162"],  // coral → teal
  ["109,184,162", "31,103,241"],  // teal → blue
];

export function PinterestCard({
  project,
  i,
  isDark,
}: {
  project: typeof projectsData[0];
  i: number;
  isDark: boolean;
}) {
  const accent = ACCENTS[i % ACCENTS.length];
  const rgb = ACCENT_RGB[accent] ?? "31,103,241";
  const [ombreFrom, ombreTo] = OMBRE_PAIRS[i % OMBRE_PAIRS.length];

  return (
    <motion.a
      href={`/work/${project.slug}`}
      initial={false}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35, ease: BRAND_EASE }}
      className="group flex flex-col rounded-2xl overflow-hidden h-full cursor-pointer relative"
      style={{
        background: isDark
          ? `linear-gradient(160deg, rgba(${ombreFrom},0.18) 0%, rgba(${ombreTo},0.08) 100%)`
          : `linear-gradient(160deg, rgba(${ombreFrom},0.10) 0%, rgba(${ombreTo},0.04) 100%)`,
        border: `1px solid rgba(${rgb},0.20)`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* ── Outer glow (visible on hover) ──────────────────── */}
      <div
        className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: `linear-gradient(160deg, rgba(${ombreFrom},0.35), rgba(${ombreTo},0.25))`,
          filter: "blur(18px)",
          zIndex: -1,
        }}
      />

      {/* ── Border glow ring ───────────────────────────────── */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          border: `1.5px solid rgba(${rgb},0.45)`,
          boxShadow: `
            inset 0 0 20px rgba(${rgb},0.08),
            0 0 30px rgba(${rgb},0.12),
            0 0 60px rgba(${rgb},0.06)
          `,
        }}
      />

      {/* ── Glassmorphic shine sweep ───────────────────────── */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-600 pointer-events-none"
        style={{
          background: `linear-gradient(
            135deg,
            rgba(255,255,255,${isDark ? "0.12" : "0.22"}) 0%,
            rgba(255,255,255,${isDark ? "0.04" : "0.08"}) 40%,
            transparent 60%
          )`,
        }}
      />

      {/* ── Grain texture overlay ──────────────────────────── */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none mix-blend-overlay"
        style={{
          opacity: isDark ? 0.06 : 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      {/* ── Ombre gradient blob (bottom-right corner) ──────── */}
      <div
        className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full pointer-events-none transition-opacity duration-700 opacity-40 group-hover:opacity-70"
        style={{
          background: `radial-gradient(circle, rgba(${ombreTo},0.30) 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />

      {/* Square image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "1/1" }}>
        {project.coverImage ? (
          <CoverMedia
            src={project.coverImage}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(160deg, rgba(${ombreFrom},0.15), rgba(${ombreTo},0.08))`,
            }}
          />
        )}
        {/* Gradient overlay at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{
            background: isDark
              ? "linear-gradient(to top, rgba(13,11,9,0.92), transparent)"
              : "linear-gradient(to top, rgba(247,241,220,0.92), transparent)",
          }}
        />
        {/* Year badge */}
        <span
          className="absolute top-3 right-3 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full"
          style={{
            background: isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.85)",
            color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {(project as { period?: string }).period ?? project.year}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2.5 px-5 py-4 flex-1 relative">
        {/* Type */}
        <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-medium text-muted-foreground">
          {project.type}
        </span>

        {/* Title */}
        <h3 className="font-display font-black uppercase text-lg md:text-xl leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">
          {project.title}
        </h3>

        {/* Description — short preview */}
        <p className="text-xs font-sans text-muted-foreground leading-relaxed line-clamp-2 flex-1">
          {(project as { cardDescription?: string }).cardDescription || project.subtitle}
        </p>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {project.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[9px] uppercase tracking-wider font-sans font-bold px-2 py-0.5 rounded-full"
              style={{
                background: `rgba(${rgb},0.12)`,
                color: `rgba(${rgb},0.8)`,
                border: `1px solid rgba(${rgb},0.10)`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.a>
  );
}
