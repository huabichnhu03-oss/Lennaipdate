import { query } from "./db.js";

import projectsSeed from "./data/projects.json" assert { type: "json" };
import aboutSeed from "./data/about.json" assert { type: "json" };
import experienceSeed from "./data/experience.json" assert { type: "json" };
import educationSeed from "./data/education.json" assert { type: "json" };
import gallerySeed from "./data/gallery.json" assert { type: "json" };
import identitySeed from "./data/identity.json" assert { type: "json" };
import contactSeed from "./data/contact.json" assert { type: "json" };
import filesSeed from "./data/files.json" assert { type: "json" };
import homepageSeed from "./data/homepage.json" assert { type: "json" };

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

export async function getSection(name: SectionName): Promise<unknown> {
  try {
    const rows = await query<{ data: unknown }>(
      "SELECT data FROM content_sections WHERE name = $1",
      [name],
    );
    if (rows.length > 0) return rows[0]!.data;
    const seed = SEEDS[name];
    await query(
      `INSERT INTO content_sections (name, data) VALUES ($1, $2::jsonb)
       ON CONFLICT (name) DO NOTHING`,
      [name, JSON.stringify(seed)],
    );
    return seed;
  } catch {
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
  await query(
    `INSERT INTO content_sections (name, data, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [name, JSON.stringify(data)],
  );
}

function isSafeHref(v: unknown): boolean {
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (s === "") return true;
  if (s.startsWith("/") || s.startsWith("#")) return true;
  return /^(https?:|mailto:|tel:)/i.test(s);
}

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
