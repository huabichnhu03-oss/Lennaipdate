import { motion } from "framer-motion";
import { CoverMedia } from "@/components/CoverMedia";
import projectsData from "@/data/projects.json";
import { BRAND_DECK, BRAND_RGB, BRAND_EASE } from "@/lib/brand";

const ACCENTS = BRAND_DECK;
const ACCENT_RGB = BRAND_RGB;

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

  return (
    <motion.a
      href={`/work/${project.slug}`}
      initial={false}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35, ease: BRAND_EASE }}
      className="group flex flex-col rounded-2xl overflow-hidden h-full cursor-pointer relative"
      style={{
        background: isDark
          ? `linear-gradient(135deg, rgba(${rgb},0.25), rgba(${rgb},0.15))`
          : `linear-gradient(135deg, rgba(${rgb},0.15), rgba(${rgb},0.08))`,
        border: `1px solid rgba(${rgb},0.25)`,
      }}
    >
      {/* Glassmorphic shine */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,${isDark ? "0.1" : "0.2"}) 0%, transparent 50%)`,
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
          <div className="w-full h-full" style={{ background: `rgba(${rgb},0.1)` }} />
        )}
        {/* Gradient overlay at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{
            background: isDark
              ? "linear-gradient(to top, rgba(13,11,9,0.9), transparent)"
              : "linear-gradient(to top, rgba(247,241,220,0.9), transparent)",
          }}
        />
        {/* Year badge */}
        <span
          className="absolute top-3 right-3 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full"
          style={{
            background: isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.85)",
            color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.8)",
          }}
        >
          {(project as { period?: string }).period ?? project.year}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2.5 px-5 py-4 flex-1">
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
