import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Sparkles,
  Star,
  Heart,
  Flower2,
  Sun,
  Cloud,
  Zap,
  Diamond,
} from "lucide-react";
import projectsSeed from "@/data/projects.json";
import { useContent } from "@/lib/use-content";
import { useTheme } from "@/context/ThemeContext";
import { PinterestCard } from "@/components/PinterestCard";
import {
  BRAND,
  BRAND_DECK,
  BRAND_EASE,
} from "@/lib/brand";

const ACCENTS = BRAND_DECK;
const FILTERS = ["All", "UX Research", "Product Design", "Analysis"];

/* ───────────────────── Cursor-following floating icons ───────────────── */
/* A handful of small decorative icons scattered across the page that
   drift slightly toward the cursor (parallax-style). Each icon has its
   own depth multiplier so they react at different rates, and a subtle
   idle float so the page feels alive even when the cursor is still. */
const FLOAT_ICONS = [
  { Icon: Sparkles, x: "8%",  y: "12%", size: 28, depth: 22, color: BRAND.coral },
  { Icon: Star,     x: "88%", y: "18%", size: 22, depth: 14, color: BRAND.pink  },
  { Icon: Flower2,  x: "92%", y: "62%", size: 26, depth: 30, color: BRAND.teal  },
  { Icon: Heart,    x: "5%",  y: "70%", size: 20, depth: 18, color: BRAND.coral },
  { Icon: Sun,      x: "78%", y: "88%", size: 24, depth: 26, color: BRAND.pink  },
  { Icon: Cloud,    x: "12%", y: "92%", size: 30, depth: 12, color: BRAND.blue  },
  { Icon: Zap,      x: "60%", y: "8%",  size: 22, depth: 20, color: BRAND.blue  },
  { Icon: Diamond,  x: "45%", y: "96%", size: 18, depth: 16, color: BRAND.teal  },
];

function CursorFollowIcons() {
  // Stored in a ref + manual transform updates so we don't trigger a
  // React re-render on every mousemove (cheap, smooth).
  const containerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: 0.5, y: 0.5 });
  const currentRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      targetRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = (t: number) => {
      // Lerp current toward target for a smooth follow.
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.06;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.06;
      const cx = currentRef.current.x - 0.5; // -0.5..+0.5
      const cy = currentRef.current.y - 0.5;
      const root = containerRef.current;
      if (root) {
        const nodes = root.querySelectorAll<HTMLElement>("[data-float]");
        nodes.forEach((node, idx) => {
          const depth = Number(node.dataset.depth ?? 16);
          // Subtle idle float so it never freezes when the cursor is still.
          const idle = Math.sin(t / 1200 + idx) * 3;
          const tx = cx * depth + idle;
          const ty = cy * depth + Math.cos(t / 1400 + idx) * 3;
          const rot = cx * (depth * 0.4);
          node.style.transform = `translate3d(${tx}px,${ty}px,0) rotate(${rot}deg)`;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {FLOAT_ICONS.map(({ Icon, x, y, size, depth, color }, i) => (
        <div
          key={i}
          data-float
          data-depth={depth}
          className="absolute"
          style={{
            left: x,
            top: y,
            color,
            opacity: 0.55,
            willChange: "transform",
            transition: "opacity 0.4s",
          }}
        >
          <Icon size={size} strokeWidth={1.6} />
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */
export default function WorkIndex() {
  const projectsData = useContent("projects", projectsSeed) as typeof projectsSeed;
  const [filter, setFilter] = useState("All");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const filtered =
    filter === "All"
      ? projectsData
      : projectsData.filter((p) => p.type === filter || p.tags.includes(filter));

  return (
    <div
      className="relative w-full"
      style={{ minHeight: "calc(100vh - 80px)" }}
    >
      <CursorFollowIcons />
      <motion.div
        className="relative w-full flex flex-col gap-10 pb-28"
        style={{ zIndex: 1 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: BRAND_EASE }}
      >
        {/* Slim caption row — replaces the old dark grain band */}
        <motion.div
          className="flex items-baseline justify-between gap-6 flex-wrap pb-3"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: BRAND_EASE }}
        >
          <span
            className="text-xs uppercase tracking-[0.42em] font-sans text-muted-foreground"
          >
            Lenna Hua · Selected Works
          </span>
          <span
            className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground/70"
          >
            {projectsData.length} projects
          </span>
        </motion.div>

        {/* Header */}
        <section
          className="flex flex-col gap-5 pb-8"
          style={{ borderBottom: `2px solid ${BRAND.coral}44` }}
        >
          <motion.h1
            className="font-display font-black uppercase leading-[0.88] tracking-tight"
            style={{ fontSize: "clamp(3.5rem,11vw,11rem)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: BRAND_EASE }}
          >
            <span style={{ color: BRAND.coral }}>Selected</span>
            <br />
            <span style={{ color: BRAND.blue }}>Works</span>
          </motion.h1>

          {/* Filter pills */}
          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.5 }}
          >
            {FILTERS.map((f, fi) => {
              const isActive = filter === f;
              const color = ACCENTS[fi % ACCENTS.length];
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-4 py-1.5 text-sm uppercase tracking-widest font-sans rounded-full transition-all duration-300"
                  style={
                    isActive
                      ? { background: color, color: "#0A0908", fontWeight: 700 }
                      : { border: `1.5px solid ${color}55`, color }
                  }
                >
                  {f}
                </button>
              );
            })}
          </motion.div>
        </section>

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          <AnimatePresence mode="popLayout">
            {filtered.map((project, gi) => {
              const i = projectsData.findIndex((p) => p.id === project.id);
              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.55,
                    delay: (gi % 6) * 0.07,
                    ease: BRAND_EASE,
                  }}
                  className="h-full"
                >
                  <Link href={`/work/${project.slug}`} className="block h-full">
                    <PinterestCard project={project} i={i} isDark={isDark} />
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-muted-foreground text-sm font-sans">No projects in this category.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
