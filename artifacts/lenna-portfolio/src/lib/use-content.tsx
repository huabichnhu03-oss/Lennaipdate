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
    // Fetch live content once on mount. If it fails (network, cold-start
    // hiccup, or first ever deploy before the DB seed runs), the SPA
    // keeps rendering with the bundled seed values — never a blank page.
    fetch("/api/content")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data || typeof data !== "object") return;
        setContent({
          projects: (data as Record<string, unknown>).projects ?? SEEDS.projects,
          about: (data as Record<string, unknown>).about ?? SEEDS.about,
          experience: (data as Record<string, unknown>).experience ?? SEEDS.experience,
          education: (data as Record<string, unknown>).education ?? SEEDS.education,
          gallery: (data as Record<string, unknown>).gallery ?? SEEDS.gallery,
          identity: (data as Record<string, unknown>).identity ?? SEEDS.identity,
          contact: (data as Record<string, unknown>).contact ?? SEEDS.contact,
          files: (data as Record<string, unknown>).files ?? SEEDS.files,
          homepage: (data as Record<string, unknown>).homepage ?? SEEDS.homepage,
        });
      })
      .catch(() => {
        // Stay on seeds. Don't surface a network error here — the page
        // is already showing valid content.
      });
    return () => {
      cancelled = true;
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
