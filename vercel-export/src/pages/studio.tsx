import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import gallerySeed from "@/data/gallery.json";
import { useContent } from "@/lib/use-content";
import { FloatingDecor } from "@/components/FloatingDecor";
import { SafeImage } from "@/components/SafeImage";

const BLUE = "#1F67F1";

const VP = { once: true, margin: "-60px" };

type GalleryItem = {
  id: string;
  kind?: "big" | "small";
  slug: string;
  title: string;
  role: string;
  year?: string;
  description?: string;
  tags?: string[];
  coverImage: string;
  images?: string[];
  imageColumns?: 1 | 2;
  order?: number;
  linkUrl?: string;
  linkLabel?: string;
};

/* Studio is a long-scroll page; we boost wheel scrolling so the masonry
   feels notably snappier than the default browser rate (~2.5x). We
   attach a single wheel listener while the page is mounted. Trackpad
   pinch-zoom (ctrlKey) and any element opted-out via
   [data-fast-scroll-skip] are left untouched. */
function useFastScroll(multiplier = 2.5) {
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-fast-scroll-skip]")) return;
      if (e.deltaY === 0) return;
      e.preventDefault();
      window.scrollBy({ top: e.deltaY * multiplier, behavior: "auto" });
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [multiplier]);
}

/* ── Modal for small artworks ───────────────────────────── */
function ArtworkModal({
  item,
  onClose,
}: {
  item: GalleryItem;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      data-fast-scroll-skip
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10"
      style={{ background: "rgba(8,8,10,0.85)", backdropFilter: "blur(8px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 30, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-background rounded-2xl overflow-hidden shadow-2xl w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 max-h-[90vh]"
        style={{ border: `1px solid ${BLUE}55` }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors text-base"
        >
          ✕
        </button>

        {/* Left — image */}
        <div className="bg-card flex items-center justify-center overflow-hidden md:max-h-[90vh]">
          <SafeImage
            src={item.coverImage}
            alt={item.title}
            className="w-full h-full object-cover md:object-contain max-h-[40vh] md:max-h-[90vh]"
            fallbackAspect="16 / 5"
          />
        </div>

        {/* Right — info */}
        <div className="flex flex-col gap-5 p-6 md:p-10 overflow-y-auto">
          <span
            className="text-xs uppercase tracking-[0.4em] font-sans font-bold w-max px-3 py-1 rounded-full"
            style={{
              color: BLUE,
              background: BLUE + "22",
              border: `1px solid ${BLUE}44`,
            }}
          >
            Artwork
          </span>
          <h2
            className="font-display font-black leading-tight tracking-tight"
            style={{ color: BLUE, fontSize: "clamp(1.6rem, 3vw, 2.6rem)" }}
          >
            {item.title}
          </h2>

          {item.description && (
            <p className="text-foreground/85 text-base md:text-lg font-sans leading-relaxed">
              {item.description}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-border mt-auto">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs uppercase tracking-[0.3em] font-sans">
                Role
              </span>
              <span className="text-foreground font-sans text-sm">
                {item.role}
              </span>
            </div>
            {item.year && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-[0.3em] font-sans">
                  Year
                </span>
                <span className="text-foreground font-sans text-sm">
                  {item.year}
                </span>
              </div>
            )}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-col gap-2 sm:col-span-2">
                <span className="text-muted-foreground text-xs uppercase tracking-[0.3em] font-sans">
                  Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] uppercase tracking-wider font-sans font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: BLUE + "20",
                        color: BLUE,
                        border: `1px solid ${BLUE}44`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {item.linkUrl && (
            <a
              href={item.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-sans font-bold uppercase tracking-widest w-max transition-transform hover:scale-[1.03]"
              style={{ background: BLUE, color: "#FFFFFF" }}
            >
              {item.linkLabel || "View project"} ↗
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Horizontal slideshow row ─────────────────────────── */
function ArtworksSlideshow({
  items,
  onOpen,
}: {
  items: GalleryItem[];
  onOpen: (item: GalleryItem) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0); // 0..1

  // Track horizontal scroll progress so we can render a thin custom
  // progress bar in place of the native scrollbar.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 0);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [items.length]);

  // Wheel: convert vertical scroll to horizontal scroll over the row.
  // Marked data-fast-scroll-skip so the page-level useFastScroll does
  // not also intercept and fight the horizontal motion.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      // Use whichever delta is larger so true horizontal wheel still works.
      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta === 0) return;
      // Only intercept if we actually have room to scroll horizontally,
      // otherwise let the page scroll vertically as normal.
      const canScrollLeft = el.scrollLeft > 0;
      const canScrollRight =
        el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      const goingRight = delta > 0;
      if ((goingRight && !canScrollRight) || (!goingRight && !canScrollLeft)) {
        return;
      }
      e.preventDefault();
      el.scrollLeft += delta * 1.5;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Arrow controls */}
      <div className="absolute -top-14 right-0 flex gap-2 z-10">
        <button
          onClick={() => scrollBy(-1)}
          aria-label="Scroll left"
          className="w-10 h-10 rounded-full border border-border hover:border-primary transition-colors flex items-center justify-center text-foreground hover:text-primary"
        >
          ←
        </button>
        <button
          onClick={() => scrollBy(1)}
          aria-label="Scroll right"
          className="w-10 h-10 rounded-full border border-border hover:border-primary transition-colors flex items-center justify-center text-foreground hover:text-primary"
        >
          →
        </button>
      </div>

      <div
        ref={scrollerRef}
        data-fast-scroll-skip
        className="flex gap-6 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth scrollbar-none"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {items.map((item, idx) => (
          <motion.button
            key={item.id}
            onClick={() => onOpen(item)}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={VP}
            transition={{ delay: idx * 0.05, duration: 0.5 }}
            className="snap-start flex-shrink-0 w-[78vw] sm:w-[44vw] md:w-[32vw] lg:w-[24vw] group cursor-pointer text-left rounded-xl overflow-hidden relative bg-card"
            style={{
              border: `2px solid ${BLUE}00`,
              transition: "border-color 0.3s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = BLUE + "aa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = BLUE + "00")
            }
          >
            <div className="aspect-[4/5] overflow-hidden">
              <SafeImage
                src={item.coverImage}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.04] transition-all duration-700"
                fallbackAspect="16 / 5"
              />
            </div>
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5"
              style={{
                background: `linear-gradient(to top, ${BLUE}dd 0%, transparent 60%)`,
              }}
            >
              <h3 className="font-display font-black uppercase text-lg text-white leading-tight">
                {item.title}
              </h3>
              <span
                className="text-xs uppercase tracking-widest font-sans mt-1 px-2 py-0.5 rounded-full w-max"
                style={{ background: "rgba(0,0,0,0.4)", color: "white" }}
              >
                {item.role}
              </span>
            </div>
            <div
              className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-black"
              style={{ background: BLUE, color: "#FFFFFF" }}
            >
              {String(idx + 1).padStart(2, "0")}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Thin progress bar tracking horizontal scroll position */}
      <div
        className="relative w-full mt-3 rounded-full overflow-hidden"
        style={{ height: "2px", background: "rgba(127,127,127,0.18)" }}
        aria-hidden
      >
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-[width] duration-100"
          style={{
            background: BLUE,
            width: `${Math.max(8, progress * 100)}%`,
          }}
        />
      </div>

      <p className="text-muted-foreground text-xs font-sans mt-3">
        Scroll horizontally or click an artwork to view it.
      </p>
    </div>
  );
}

/* ── Page ───────────────────────────────────────── */
export default function Studio() {
  useFastScroll(1);
  const galleryData = useContent("gallery", gallerySeed);
  const all = galleryData as GalleryItem[];
  const bigItems = all.filter((i) => (i.kind ?? "big") === "big");
  const smallItems = all.filter((i) => i.kind === "small");

  const [modalItem, setModalItem] = useState<GalleryItem | null>(null);

  return (
    <div className="w-full flex flex-col gap-20 pt-12 md:pt-24 pb-24">
      <AnimatePresence>
        {modalItem && (
          <ArtworkModal item={modalItem} onClose={() => setModalItem(null)} />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <section className="relative overflow-hidden">
        <FloatingDecor opacity={0.4} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-6 max-w-3xl relative z-10"
        >
          <span
            className="text-sm uppercase tracking-[0.5em] font-sans font-bold w-max px-3 py-1 rounded-full"
            style={{
              color: BLUE,
              background: BLUE + "22",
              border: `1px solid ${BLUE}44`,
            }}
          >
            Studio · Archive
          </span>
          <h1
            className="font-display font-black uppercase leading-[0.88] tracking-tight"
            style={{ fontSize: "clamp(3.5rem,10vw,9rem)" }}
          >
            <span style={{ color: BLUE }}>Stu</span>
            <span style={{ color: BLUE }}>dio</span>
          </h1>
          <p className="text-muted-foreground text-xl leading-relaxed font-light font-sans max-w-xl">
            A continuous archive of art direction, illustration, photography,
            motion, and editorial work — full projects up top, smaller
            artworks in a side-scrolling reel below.
          </p>
        </motion.div>
      </section>

      {/* ── Big Projects (masonry) ── */}
      {bigItems.length > 0 && (
        <section className="flex flex-col gap-6">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div className="flex flex-col gap-2">
              <span
                className="text-xs uppercase tracking-[0.4em] font-sans font-bold w-max"
                style={{ color: BLUE }}
              >
                01 · Section
              </span>
              <h2 className="font-display font-black uppercase tracking-tight text-3xl md:text-5xl">
                Big Projects
              </h2>
            </div>
            <p className="text-muted-foreground font-sans text-sm md:text-base max-w-md">
              Full directorial and production projects — click any tile to
              read the full project page.
            </p>
          </div>

          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 mt-2">
            {bigItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VP}
                transition={{
                  delay: (index % 3) * 0.08,
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="break-inside-avoid"
              >
                <Link
                  href={`/studio/${item.slug}`}
                  className="block relative group cursor-pointer rounded-xl overflow-hidden"
                  style={{
                    border: `2px solid ${BLUE}00`,
                    transition: "border-color 0.3s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = BLUE + "aa")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = BLUE + "00")
                  }
                >
                  <div className="overflow-hidden bg-card">
                    <SafeImage
                      src={item.coverImage}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-auto object-cover opacity-85 group-hover:opacity-100 group-hover:scale-[1.04] transition-all duration-700"
                      fallbackAspect="16 / 5"
                    />
                  </div>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end gap-3 p-5"
                    style={{
                      background: `linear-gradient(to top, ${BLUE}dd 0%, transparent 60%)`,
                    }}
                  >
                    <h3 className="font-display font-black uppercase text-lg text-white leading-tight pr-2">
                      {item.title}
                    </h3>
                    {item.role &&
                      item.role.trim().toLowerCase() !==
                        item.title.trim().toLowerCase() && (
                        <span
                          className="text-[11px] uppercase tracking-widest font-sans px-2 py-0.5 rounded-full w-max max-w-full truncate"
                          style={{ background: "rgba(0,0,0,0.4)", color: "white" }}
                        >
                          {item.role}
                        </span>
                      )}
                    <span
                      className="text-[10px] uppercase tracking-[0.3em] font-sans font-bold px-3 py-1.5 rounded-full w-max"
                      style={{ background: "white", color: BLUE }}
                    >
                      Read more →
                    </span>
                  </div>
                  <div
                    className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-sm font-display font-black"
                    style={{ background: BLUE, color: "#FFFFFF" }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Small Artworks (horizontal slideshow) ── */}
      {smallItems.length > 0 && (
        <section className="flex flex-col gap-6 pt-4">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div className="flex flex-col gap-2">
              <span
                className="text-xs uppercase tracking-[0.4em] font-sans font-bold w-max"
                style={{ color: BLUE }}
              >
                02 · Section
              </span>
              <h2 className="font-display font-black uppercase tracking-tight text-3xl md:text-5xl">
                Artworks
              </h2>
            </div>
            <p className="text-muted-foreground font-sans text-sm md:text-base max-w-md">
              Smaller pieces, studies, and standalone artworks — click any
              card to open it in detail.
            </p>
          </div>

          <ArtworksSlideshow items={smallItems} onOpen={setModalItem} />
        </section>
      )}
    </div>
  );
}
