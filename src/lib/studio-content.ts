import type { GalleryItem, Project, Studio, StudioLogo } from "@/components/admin/types";

export const DEFAULT_STUDIO: Studio = {
  eyebrow: "Studio · Archive",
  heading: "Studio",
  intro:
    "A living scrapbook of art direction, illustration, photography, motion, and editorial work — full productions above, smaller pieces in folders below. Hover a folder and the work spills out.",
  bigEyebrow: "01 · Productions",
  bigHeading: "Big Projects",
  bigBlurb:
    "Full directorial and production projects — click any tile to read the full project page.",
  artworksEyebrow: "02 · Studies",
  artworksHeading: "Artworks",
  artworksBlurb:
    "Smaller pieces, studies, and standalone artworks. Hover a folder to fan the images out, then click to open.",
  artworksCardSize: "lg",
  artworksDefaultStyle: "folder",
  showGrid: true,
  showDecor: true,
  showLogoMarquee: true,
  logoMarqueeSpeed: 32,
  logoMarqueeLabel: "Marks & projects",
  logoMarqueeAuto: true,
  logos: [],
};

export function mergeStudio(live: Partial<Studio> | null | undefined): Studio {
  const next = { ...DEFAULT_STUDIO, ...(live ?? {}) };
  if (!Array.isArray(next.logos)) next.logos = [];
  if (
    next.artworksCardSize !== "md" &&
    next.artworksCardSize !== "lg" &&
    next.artworksCardSize !== "xl"
  ) {
    next.artworksCardSize = "lg";
  }
  if (next.artworksDefaultStyle !== "slideshow") {
    next.artworksDefaultStyle = "folder";
  }
  if (typeof next.logoMarqueeSpeed !== "number" || next.logoMarqueeSpeed < 8) {
    next.logoMarqueeSpeed = DEFAULT_STUDIO.logoMarqueeSpeed;
  }
  return next;
}

export function artworkStyleOf(
  item: GalleryItem,
  fallback: Studio["artworksDefaultStyle"],
): "slideshow" | "folder" {
  if (item.cardStyle === "slideshow" || item.cardStyle === "folder") return item.cardStyle;
  return fallback;
}

function asLogo(id: string, name: string, src?: string, href?: string): StudioLogo | null {
  const label = name.trim();
  const image = src?.trim() ?? "";
  if (!label && !image) return null;
  return {
    id,
    name: label || "Untitled",
    src: image || undefined,
    href: href?.trim() || undefined,
  };
}

/** Custom marquee logos, then optional auto logos from gallery + work projects. */
export function collectMarqueeLogos(
  studio: Studio,
  gallery: GalleryItem[],
  projects: Project[],
): StudioLogo[] {
  const custom = (studio.logos ?? []).filter((l) => l.name?.trim() || l.src?.trim());
  if (!studio.logoMarqueeAuto) return custom;

  const seen = new Set(
    custom.map((l) => (l.src || l.name).trim().toLowerCase()).filter(Boolean),
  );
  const auto: StudioLogo[] = [];

  const push = (logo: StudioLogo | null) => {
    if (!logo) return;
    const key = (logo.src || logo.name).trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    auto.push(logo);
  };

  for (const item of gallery) {
    if (!item.logo?.trim()) continue;
    push(
      asLogo(
        `g-${item.id}`,
        item.title,
        item.logo,
        item.slug ? `/studio/${item.slug}` : item.linkUrl,
      ),
    );
  }
  for (const proj of projects) {
    if (proj.archived) continue;
    if (!proj.logo?.trim()) continue;
    push(
      asLogo(
        `p-${proj.id}`,
        proj.title,
        proj.logo,
        proj.slug ? `/work/${proj.slug}` : undefined,
      ),
    );
  }

  return [...custom, ...auto];
}
