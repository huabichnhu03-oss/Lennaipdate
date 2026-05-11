import { motion } from "framer-motion";
import { CoverMedia } from "@/components/CoverMedia";
// Imported only for the prop type — the actual project comes from the parent.
import projectsData from "@/data/projects.json";
import {
  BRAND_DECK,
  BRAND_RGB,
  BRAND_EASE,
  BRAND_HOVER,
} from "@/lib/brand";

const ACCENTS = BRAND_DECK;
const ACCENT_RGB = BRAND_RGB;
const CARD_ALPHA = 0.78;

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
  const alpha = CARD_ALPHA;
  const dotAlpha = 0.07;
  return (
    <motion.div
      initial={false}
      whileHover={{
        y: BRAND_HOVER.lift,
        rotate: BRAND_HOVER.rotate,
        boxShadow: isDark
          ? `0 12px 32px rgba(${rgb},0.28), 0 0 24px 1px rgba(${rgb},0.16), inset 0 0 0 1px rgba(255,255,255,0.10)`
          : `0 10px 32px rgba(${rgb},0.32), 0 0 24px 1px rgba(${rgb},0.18)`,
      }}
      transition={{ duration: 0.35, ease: BRAND_EASE }}
      className="flex flex-col rounded-3xl overflow-hidden h-full bg-background"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(0,0,0,${dotAlpha}) 1px, transparent 1px), linear-gradient(rgba(${rgb},${alpha}), rgba(${rgb},${alpha}))`,
        backgroundSize: "14px 14px, 100% 100%",
        boxShadow: isDark
          ? `0 8px 36px rgba(${rgb},0.18), inset 0 0 0 1px rgba(255,255,255,0.06)`
          : `0 6px 28px rgba(${rgb},0.28)`,
      }}
    >
      <div className="flex flex-col gap-2 px-5 pt-5 pb-4">
        <span
          className="text-xs font-sans italic font-medium leading-none"
          style={{ color: "rgba(0,0,0,0.55)" }}
        >
          {project.featured ? "★ Featured · " : ""}
          {project.type}
        </span>
        <h3
          className="font-display font-black uppercase text-2xl md:text-3xl leading-tight tracking-tight"
          style={{ color: "rgba(0,0,0,0.85)" }}
        >
          {project.title}
        </h3>
      </div>

      <div className="px-4 pb-4 flex-1 min-h-0">
        <div
          className="relative overflow-hidden rounded-2xl group"
          style={{ aspectRatio: "4/3" }}
        >
          {project.coverImage ? (
            <CoverMedia
              src={project.coverImage}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full" style={{ background: "rgba(0,0,0,0.1)" }} />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-2xl" />
        </div>
      </div>

      <div
        className="flex items-center justify-between px-5 py-3 gap-2 flex-wrap"
        style={{ borderTop: "2px dashed rgba(0,0,0,0.2)" }}
      >
        <span className="text-[11px] font-mono font-bold" style={{ color: "rgba(0,0,0,0.6)" }}>
          {(project as { period?: string }).period ?? project.year}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {project.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[9px] uppercase tracking-wider font-sans font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(0,0,0,0.15)", color: "rgba(0,0,0,0.7)" }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
