import { motion } from "framer-motion";
import { SafeImage } from "@/components/SafeImage";
import { galleryImageSrc } from "@/lib/gallery-image";
import type { GalleryImageEntry } from "@/lib/gallery-image";

const MANILA = "#D4B483";
const VP = { once: true, margin: "-60px" };

const FAN = [
  { rest: "translate(-18%, 28%) rotate(-10deg)", hover: "translate(-78%, -42%) rotate(-12deg)" },
  { rest: "translate(0%, 22%) rotate(2deg)", hover: "translate(0%, -58%) rotate(0deg)" },
  { rest: "translate(18%, 28%) rotate(10deg)", hover: "translate(78%, -42%) rotate(11deg)" },
];

function popoutSources(coverImage: string, images?: GalleryImageEntry[]): string[] {
  const extra = (images ?? []).map(galleryImageSrc).filter(Boolean);
  const all = [coverImage, ...extra].filter(Boolean);
  const unique: string[] = [];
  for (const src of all) {
    if (!unique.includes(src)) unique.push(src);
  }
  if (unique.length >= 3) return unique.slice(0, 3);
  if (unique.length === 2) return unique;
  if (unique.length === 1) return unique;
  return [];
}

export function FolderCard({
  title,
  role,
  description,
  coverImage,
  images,
  stampImage,
  folderColor,
  index,
  sizeClass,
  onOpen,
}: {
  title: string;
  role?: string;
  description?: string;
  coverImage: string;
  images?: GalleryImageEntry[];
  stampImage?: string;
  folderColor?: string;
  index: number;
  sizeClass: string;
  onOpen: () => void;
}) {
  const pops = popoutSources(coverImage, images);
  const stamp = stampImage || coverImage;
  const fill = folderColor?.trim() || MANILA;
  const tabFill = shade(fill, -12);

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VP}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      className={`folder-card snap-start flex-shrink-0 ${sizeClass} group cursor-pointer text-left relative`}
      aria-label={`${title} — hover to preview, click to open`}
    >
      <div className="absolute inset-x-4 bottom-[18%] top-0 pointer-events-none">
        {pops.map((src, i) => {
          const fan = FAN[i] ?? FAN[1]!;
          return (
            <div
              key={`${src}-${i}`}
              className="folder-popout absolute left-1/2 top-[38%] w-[46%] aspect-[4/5] -translate-x-1/2 rounded-md overflow-hidden bg-white shadow-[0_10px_28px_rgba(40,24,8,0.22)] border border-white"
              style={{
                zIndex: i,
                ["--folder-pop-rest" as string]: fan.rest,
                ["--folder-pop-hover" as string]: fan.hover,
              }}
            >
              <SafeImage
                src={src}
                alt=""
                className="w-full h-full object-cover"
                fallbackAspect="4 / 5"
              />
            </div>
          );
        })}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col" style={{ height: "72%" }}>
        <div
          className="self-start h-5 w-[38%] rounded-t-[6px]"
          style={{
            background: tabFill,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
          }}
          aria-hidden
        />
        <div
          className="folder-body flex-1 rounded-b-xl rounded-tr-xl px-4 pt-4 pb-4 flex flex-col gap-2 overflow-hidden relative"
          style={{
            background: `linear-gradient(180deg, ${lighten(fill, 8)} 0%, ${fill} 55%, ${shade(fill, 8)} 100%)`,
            boxShadow:
              "0 14px 32px rgba(60, 32, 8, 0.18), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          <div
            className="absolute inset-0 opacity-30 pointer-events-none mix-blend-multiply"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent 0, transparent 11px, rgba(90,50,10,0.07) 11px, rgba(90,50,10,0.07) 12px)",
            }}
            aria-hidden
          />
          {stamp && (
            <div className="relative z-[1] w-14 h-16 md:w-16 md:h-[4.5rem] bg-white p-[3px] rotate-[-6deg] shadow-sm">
              <div
                className="w-full h-full overflow-hidden"
                style={{
                  clipPath:
                    "polygon(6% 0, 94% 0, 100% 6%, 100% 94%, 94% 100%, 6% 100%, 0 94%, 0 6%)",
                }}
              >
                <SafeImage
                  src={stamp}
                  alt=""
                  className="w-full h-full object-cover grayscale"
                  fallbackAspect="3 / 4"
                />
              </div>
            </div>
          )}
          <h3
            className="relative z-[1] font-serif italic leading-none mt-1"
            style={{
              color: "#1F4E9A",
              fontSize: "clamp(1.6rem, 2.4vw, 2.35rem)",
            }}
          >
            {title}
          </h3>
          {role && (
            <span className="relative z-[1] text-[10px] uppercase tracking-[0.22em] font-sans font-bold text-[#6B4A28]/80">
              {role}
            </span>
          )}
          {description && (
            <p className="relative z-[1] text-[13px] md:text-sm font-serif leading-snug text-[#4A3420]/90 line-clamp-3">
              {description}
            </p>
          )}
          <span className="relative z-[1] mt-auto text-[10px] uppercase tracking-[0.28em] font-sans font-bold text-[#6B4A28]/70">
            Click to open →
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function shade(hex: string, amount: number): string {
  const { r, g, b } = parseHex(hex);
  const t = amount / 100;
  const mix = (c: number) =>
    Math.round(amount < 0 ? c * (1 + t) : c + (255 - c) * t);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function lighten(hex: string, amount: number): string {
  return shade(hex, Math.abs(amount));
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.padEnd(6, "0").slice(0, 6);
  const n = parseInt(full, 16);
  if (!Number.isFinite(n)) return { r: 212, g: 180, b: 131 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
