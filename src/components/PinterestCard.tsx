import { memo } from "react";
import { CoverMedia } from "@/components/CoverMedia";
import projectsData from "@/data/projects.json";
import { BRAND_DECK, BRAND_RGB } from "@/lib/brand";

const ACCENTS = BRAND_DECK;
const ACCENT_RGB = BRAND_RGB;

export const PinterestCard = memo(function PinterestCard({
  project,
  i,
  isDark,
  featured,
}: {
  project: (typeof projectsData)[0];
  i: number;
  isDark: boolean;
  featured?: boolean;
}) {
  const accent = ACCENTS[i % ACCENTS.length];
  const rgb = ACCENT_RGB[accent] ?? "31,103,241";

  return (
    <a
      href={`/work/${project.slug}`}
      className={`group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 ${
        featured ? "sm:col-span-2 aspect-[16/10]" : "aspect-[4/5]"
      }`}
      style={{ outlineColor: accent }}
      tabIndex={0}
    >
      {/* ── Full-bleed cover image ───────────────────────────── */}
      <div className="absolute inset-0">
        {project.coverImage ? (
          <CoverMedia
            src={project.coverImage}
            alt={project.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04] group-focus-within:scale-[1.04]"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: isDark
                ? "linear-gradient(160deg, hsl(30 11% 10%), hsl(30 11% 5%))"
                : "linear-gradient(160deg, hsl(30 12% 92%), hsl(30 12% 85%))",
            }}
          />
        )}
      </div>

      {/* ── Bottom gradient (always visible, intensifies on hover) ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.05) 70%, transparent 100%)",
          opacity: 0.6,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.50) 35%, rgba(0,0,0,0.10) 65%, transparent 100%)",
        }}
      />

      {/* ── Subtle border ─────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-500"
        style={{ border: `1px solid rgba(${rgb}, 0.15)` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-500"
        style={{
          border: `1.5px solid rgba(${rgb}, 0.45)`,
          boxShadow: `0 0 40px rgba(${rgb}, 0.08)`,
        }}
      />

      {/* ── Top badges (always visible) ───────────────────────── */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10 pointer-events-none">
        <span
          className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold px-2.5 py-1 rounded-full backdrop-blur-sm"
          style={{
            background: isDark ? "rgba(20,18,15,0.7)" : "rgba(255,252,245,0.8)",
            color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)",
          }}
        >
          {project.type}
        </span>
        <span
          className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full backdrop-blur-sm"
          style={{
            background: isDark ? "rgba(20,18,15,0.7)" : "rgba(255,252,245,0.8)",
            color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)",
          }}
        >
          {(project as { period?: string }).period ?? project.year}
        </span>
      </div>

      {/* ── Slide-up content panel ────────────────────────────── */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 px-5 pb-5 pt-10
          translate-y-[calc(100%-3.5rem)] group-hover:translate-y-0 group-focus-within:translate-y-0
          transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          motion-reduce:translate-y-0 motion-reduce:transition-none"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.90) 60%, transparent 100%)",
        }}
      >
        {/* Title — always peeking at the bottom */}
        <h3 className="font-display font-black uppercase text-lg md:text-xl leading-tight tracking-tight text-white">
          {project.title}
        </h3>

        {/* Description — revealed on hover */}
        <p className="text-xs font-sans text-white/70 leading-relaxed line-clamp-2 transition-opacity duration-300 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:opacity-100 motion-reduce:transition-none">
          {(project as { cardDescription?: string }).cardDescription ||
            project.subtitle}
        </p>

        {/* Tags — revealed on hover */}
        <div className="flex items-center gap-1.5 flex-wrap transition-opacity duration-300 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:opacity-100 motion-reduce:transition-none">
          {project.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[9px] uppercase tracking-wider font-sans font-bold px-2 py-0.5 rounded-full"
              style={{
                background: `rgba(${rgb}, 0.25)`,
                color: "rgba(255,255,255,0.85)",
                border: `1px solid rgba(${rgb}, 0.35)`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
});
