import { readSection, writeSection } from "./db.js";

// Bundled JSON files act as the seed AND the always-available fallback.
// If the DB is empty (first deploy) or briefly unreachable (cold start
// hiccup), reads fall back to these.
import projectsSeed from "../_data/projects.json" with { type: "json" };
import aboutSeed from "../_data/about.json" with { type: "json" };
import experienceSeed from "../_data/experience.json" with { type: "json" };
import educationSeed from "../_data/education.json" with { type: "json" };
import gallerySeed from "../_data/gallery.json" with { type: "json" };
import identitySeed from "../_data/identity.json" with { type: "json" };
import contactSeed from "../_data/contact.json" with { type: "json" };
import filesSeed from "../_data/files.json" with { type: "json" };
import homepageSeed from "../_data/homepage.json" with { type: "json" };

export const ALLOWED_SECTIONS = [
  "projects",
  "about",
  "experience",
  "education",
  "gallery",
  "identity",
  "contact",
  "files",
  "homepage",
] as const;

export type SectionName = (typeof ALLOWED_SECTIONS)[number];

export function isAllowedSection(s: string): s is SectionName {
  return (ALLOWED_SECTIONS as readonly string[]).includes(s);
}

const SEEDS: Record<SectionName, unknown> = {
  projects: projectsSeed,
  about: aboutSeed,
  experience: experienceSeed,
  education: educationSeed,
  gallery: gallerySeed,
  identity: identitySeed,
  contact: contactSeed,
  files: filesSeed,
  homepage: homepageSeed,
};

// Read a section. If missing in DB, lazily seed it from the bundled JSON
// so the very first visit after deploy has DB-backed content.
export async function getSection(name: SectionName): Promise<unknown> {
  try {
    const existing = await readSection(name);
    if (existing !== null) return existing;
    const seed = SEEDS[name];
    await writeSection(name, seed);
    return seed;
  } catch (err) {
    // DB unreachable: serve the bundled JSON so the site never looks broken.
    console.warn(`[content-store] DB read failed for "${name}", serving seed:`, err);
    return SEEDS[name];
  }
}

export async function getAllSections(): Promise<Record<SectionName, unknown>> {
  const out = {} as Record<SectionName, unknown>;
  for (const name of ALLOWED_SECTIONS) {
    out[name] = await getSection(name);
  }
  return out;
}

export async function setSection(name: SectionName, data: unknown): Promise<void> {
  await writeSection(name, data);
}

export function getSeed(name: SectionName): unknown {
  return SEEDS[name];
}

// Allow relative paths, fragments, mail/tel, and http(s). Block
// javascript:, data:, vbscript:, etc. Empty string is allowed (means
// the CTA is unset).
function isSafeHref(v: unknown): boolean {
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (s === "") return true;
  if (s.startsWith("/") || s.startsWith("#")) return true;
  return /^(https?:|mailto:|tel:)/i.test(s);
}

// Returns null when the payload is acceptable, otherwise a user-facing
// reason string. Lightweight per-section sanity checks only.
export function validateSection(name: SectionName, data: unknown): string | null {
  if (name !== "homepage") return null;
  if (typeof data !== "object" || data === null) return "Invalid homepage payload";
  const home = (data as { home?: unknown }).home;
  if (typeof home !== "object" || home === null) return null;
  const h = home as Record<string, unknown>;
  if ("primaryCtaHref" in h && !isSafeHref(h["primaryCtaHref"])) {
    return "Primary CTA link must be a relative path, http(s), mailto, or tel URL";
  }
  if ("secondaryCtaHref" in h && !isSafeHref(h["secondaryCtaHref"])) {
    return "Secondary CTA link must be a relative path, http(s), mailto, or tel URL";
  }
  return null;
}
