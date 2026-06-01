import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Build-time fallback. These are the same JSON files the API seeds the
// database from on first deploy, so the SPA can render correctly even
// before the API responds (or if the DB is briefly unreachable).
import projectsSeed from "@/data/projects.json";
import aboutSeed from "@/data/about.json";
import experienceSeed from "@/data/experience.json";
import educationSeed from "@/data/education.json";
import gallerySeed from "@/data/gallery.json";
import identitySeed from "@/data/identity.json";
import contactSeed from "@/data/contact.json";
import filesSeed from "@/data/files.json";
import homepageSeed from "@/data/homepage.json";

type ContentMap = {
  projects: unknown;
  about: unknown;
  experience: unknown;
  education: unknown;
  gallery: unknown;
  identity: unknown;
  contact: unknown;
  files: unknown;
  homepage: unknown;
};

const SEEDS: ContentMap = {
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

const ContentCtx = createContext<ContentMap>(SEEDS);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ContentMap>(SEEDS);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const r = await fetch("/api/content?meta=1");
      if (!r.ok) return;
      const payload = (await r.json()) as {
        data?: Record<string, unknown>;
        meta?: Record<string, { updatedAt?: string | null }>;
      };
      const data = payload.data;
      if (cancelled || !data || typeof data !== "object") return;
      setContent({
        projects: data.projects ?? SEEDS.projects,
        about: data.about ?? SEEDS.about,
        experience: data.experience ?? SEEDS.experience,
        education: data.education ?? SEEDS.education,
        gallery: data.gallery ?? SEEDS.gallery,
        identity: data.identity ?? SEEDS.identity,
        contact: data.contact ?? SEEDS.contact,
        files: data.files ?? SEEDS.files,
        homepage: data.homepage ?? SEEDS.homepage,
      });
    };
    // Fetch live content once on mount. If it fails (network, cold-start
    // hiccup, or first ever deploy before the DB seed runs), the SPA
    // keeps rendering with the bundled seed values — never a blank page.
    hydrate()
      .catch(() => {
        // Stay on seeds. Don't surface a network error here — the page
        // is already showing valid content.
      });
    const timer = window.setInterval(() => {
      void hydrate().catch(() => {
        // Keep current rendered data if refresh fails.
      });
    }, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return <ContentCtx.Provider value={content}>{children}</ContentCtx.Provider>;
}

// Typed accessor. Pages call this with the same JSON they used to import
// directly — that import becomes the per-section fallback so the
// returned value is never undefined.
export function useContent<T>(section: keyof ContentMap, fallback: T): T {
  const ctx = useContext(ContentCtx);
  const value = ctx[section];
  return (value as T) ?? fallback;
}
