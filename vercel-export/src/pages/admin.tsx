import { createContext, useContext, useEffect, useRef, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import projectsDataRaw from "@/data/projects.json";
import aboutDataRaw from "@/data/about.json";
import experienceDataRaw from "@/data/experience.json";
import educationDataRaw from "@/data/education.json";
import galleryDataRaw from "@/data/gallery.json";
import identityDataRaw from "@/data/identity.json";
import contactDataRaw from "@/data/contact.json";
import filesDataRaw from "@/data/files.json";
import homepageDataRaw from "@/data/homepage.json";
import { SafeImage } from "@/components/SafeImage";
import { AdminSortableList } from "./admin-sortable";

const STORAGE_KEY = "lenna_admin_draft";
const AUTH_KEY = "lenna_admin_auth";
const TOKEN_KEY = "lenna_admin_token";

const memoryStore: Record<string, string> = {};

const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryStore[key] ?? null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      memoryStore[key] = value;
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      delete memoryStore[key];
    }
  },
};

const memorySession: Record<string, string> = {};

const safeSession = {
  getItem(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return memorySession[key] ?? null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      memorySession[key] = value;
    }
  },
  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      delete memorySession[key];
    }
  },
};

type SectionType = "text" | "image" | "problem-solution";

type Section = {
  id: string;
  type: SectionType;
  title?: string;
  summary?: string;
  body?: string;
  src?: string;
  caption?: string;
  problem?: string;
  solution?: string;
};

type Project = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  type: string;
  tags: string[];
  description: string;
  bullets?: string[];
  challenge: string;
  solution: string;
  impact: string;
  coverImage: string;
  year: string;
  period?: string;
  featured: boolean;
  sections: Section[];
};

type SkillGroup = {
  category: string;
  items: string[];
};

type About = {
  bio: string[];
  skills: SkillGroup[];
};

type ExperienceItem = {
  id: string;
  role: string;
  company: string;
  location?: string;
  period: string;
  bullets: string[];
};

type EducationItem = {
  id: string;
  degree: string;
  institution: string;
  year: string;
};

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

type Identity = {
  name: string;
  role: string;
};

type SocialLink = {
  label: string;
  href: string;
};

type Contact = {
  email: string;
  phone: string;
  location: string;
  socials: SocialLink[];
};

type ResumeMeta = {
  url: string;
  filename: string;
  updatedAt: string;
};

type Files = {
  resume: ResumeMeta;
};

type EntryCard = {
  number: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
};

type Homepage = {
  entry: {
    wordmarkPrefix: string;
    wordmarkSuffix: string;
    topbarTagline: string;
    designCard: EntryCard;
    artCard: EntryCard;
    bottomPrompt: string;
  };
  home: {
    heroEyebrow: string;
    heroIntro: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    selectedWorkHeading: string;
    selectedWorkLinkLabel: string;
    aboutEyebrow: string;
    aboutHeading: string;
    aboutCtaLabel: string;
  };
};

type ContentData = {
  projects: Project[];
  about: About;
  experience: ExperienceItem[];
  education: EducationItem[];
  gallery: GalleryItem[];
  identity: Identity;
  contact: Contact;
  files: Files;
  homepage: Homepage;
};

const defaultData: ContentData = {
  projects: projectsDataRaw as Project[],
  about: aboutDataRaw as About,
  experience: experienceDataRaw as ExperienceItem[],
  education: educationDataRaw as EducationItem[],
  gallery: galleryDataRaw as GalleryItem[],
  identity: identityDataRaw as Identity,
  contact: contactDataRaw as Contact,
  files: filesDataRaw as Files,
  homepage: homepageDataRaw as Homepage,
};

function loadDraft(): ContentData {
  const fresh = JSON.parse(JSON.stringify(defaultData)) as ContentData;
  try {
    const saved = safeStorage.getItem(STORAGE_KEY);
    if (saved) {
      // Merge over defaults so older drafts (missing newly-added sections
      // like identity / contact) don't render undefined fields.
      const parsed = JSON.parse(saved) as Partial<ContentData>;
      return { ...fresh, ...parsed } as ContentData;
    }
  } catch {
    // fall through to default
  }
  return fresh;
}

function deriveTagStats(
  projects: Project[],
  gallery: GalleryItem[],
): Map<string, { projects: string[]; gallery: string[] }> {
  const sets = new Map<string, { projects: Set<string>; gallery: Set<string> }>();
  const bump = (raw: string, kind: "projects" | "gallery", id: string) => {
    const k = (raw ?? "").trim();
    if (!k) return;
    if (!sets.has(k)) sets.set(k, { projects: new Set(), gallery: new Set() });
    sets.get(k)![kind].add(id);
  };
  for (const p of projects) for (const t of p.tags ?? []) bump(t, "projects", p.id);
  for (const g of gallery) for (const t of g.tags ?? []) bump(t, "gallery", g.id);
  const out = new Map<string, { projects: string[]; gallery: string[] }>();
  for (const [k, v] of sets) {
    out.set(k, { projects: Array.from(v.projects), gallery: Array.from(v.gallery) });
  }
  return out;
}

function rewriteTags(tags: string[], rewrite: (t: string) => string | null): string[] {
  const out: string[] = [];
  for (const t of tags) {
    const v = rewrite(t);
    if (!v) continue;
    if (out.includes(v)) continue;
    out.push(v);
  }
  return out;
}

function applyTagRename(
  projects: Project[],
  gallery: GalleryItem[],
  from: string,
  to: string,
): { projects: Project[]; gallery: GalleryItem[] } {
  const target = to.trim();
  if (!target) return { projects, gallery };
  const fn = (t: string) => (t === from ? target : t);
  return {
    projects: projects.map((p) => ({ ...p, tags: rewriteTags(p.tags ?? [], fn) })),
    gallery: gallery.map((g) => ({ ...g, tags: rewriteTags(g.tags ?? [], fn) })),
  };
}

function applyTagMerge(
  projects: Project[],
  gallery: GalleryItem[],
  sources: string[],
  target: string,
): { projects: Project[]; gallery: GalleryItem[] } {
  const tgt = target.trim();
  if (!tgt) return { projects, gallery };
  const set = new Set(sources);
  const fn = (t: string) => (set.has(t) ? tgt : t);
  return {
    projects: projects.map((p) => ({ ...p, tags: rewriteTags(p.tags ?? [], fn) })),
    gallery: gallery.map((g) => ({ ...g, tags: rewriteTags(g.tags ?? [], fn) })),
  };
}

function applyTagDelete(
  projects: Project[],
  gallery: GalleryItem[],
  tag: string,
): { projects: Project[]; gallery: GalleryItem[] } {
  const fn = (t: string) => (t === tag ? null : t);
  return {
    projects: projects.map((p) => ({ ...p, tags: rewriteTags(p.tags ?? [], fn) })),
    gallery: gallery.map((g) => ({ ...g, tags: rewriteTags(g.tags ?? [], fn) })),
  };
}

function TagsInput({
  label,
  tags,
  suggestions,
  onChange,
}: {
  label: string;
  tags: string[];
  suggestions: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const commit = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (tags.includes(v)) {
      setInput("");
      return;
    }
    onChange([...tags, v]);
    setInput("");
  };
  const remove = (i: number) => onChange(tags.filter((_, idx) => idx !== i));
  const trimmed = input.trim().toLowerCase();
  const matching = suggestions
    .filter((s) => !tags.includes(s))
    .filter((s) => (trimmed ? s.toLowerCase().includes(trimmed) : true))
    .slice(0, 8);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[#8A8278] text-sm uppercase tracking-widest">{label}</label>
      <div className="flex flex-wrap gap-2 border-b border-[#3A3530] py-2 focus-within:border-[#C8A96E] transition-colors relative">
        {tags.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="inline-flex items-center gap-1.5 bg-[#1B1815] border border-[#3A3530] text-[#F2EDE5] text-xs px-2 py-1 rounded"
          >
            {t}
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-[#8A8278] hover:text-red-400 leading-none text-base"
              aria-label={`Remove ${t}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit(input);
            } else if (e.key === "Backspace" && !input && tags.length) {
              remove(tags.length - 1);
            }
          }}
          placeholder={tags.length ? "" : "Type a tag and press Enter…"}
          className="flex-1 min-w-[140px] bg-transparent text-[#F2EDE5] text-sm focus:outline-none"
        />
        {focused && matching.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-[#0A0908] border border-[#3A3530] rounded shadow-lg max-h-56 overflow-y-auto">
            {matching.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(s);
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-[#F2EDE5] hover:bg-[#1B1815]"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TagsManager({
  projects,
  gallery,
  onProjectsChange,
  onGalleryChange,
}: {
  projects: Project[];
  gallery: GalleryItem[];
  onProjectsChange: (p: Project[]) => void;
  onGalleryChange: (g: GalleryItem[]) => void;
}) {
  const stats = deriveTagStats(projects, gallery);
  const tags = Array.from(stats.entries())
    .map(([tag, refs]) => ({
      tag,
      projects: refs.projects,
      gallery: refs.gallery,
      total: refs.projects.length + refs.gallery.length,
    }))
    .sort((a, b) => b.total - a.total || a.tag.localeCompare(b.tag));

  const [filter, setFilter] = useState("");
  const [renamingTag, setRenamingTag] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [mergingTag, setMergingTag] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const apply = (next: { projects: Project[]; gallery: GalleryItem[] }) => {
    onProjectsChange(next.projects);
    onGalleryChange(next.gallery);
  };

  const lowerCounts = new Map<string, number>();
  for (const t of tags) {
    const k = t.tag.toLowerCase();
    lowerCounts.set(k, (lowerCounts.get(k) ?? 0) + 1);
  }

  const filtered = filter
    ? tags.filter((t) => t.tag.toLowerCase().includes(filter.toLowerCase()))
    : tags;

  const closeAll = () => {
    setRenamingTag(null);
    setMergingTag(null);
    setConfirmDelete(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[#F2EDE5] text-lg font-serif">Tags ({tags.length})</h2>
          <p className="text-[#8A8278] text-xs mt-1 max-w-xl">
            Rename, merge, or delete tags across all projects and gallery items at
            once. Click <span className="text-[#C8A96E]">Save to Site</span> after
            changes to publish. Rows highlighted gold are duplicate-casing variants.
          </p>
        </div>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter tags…"
          className="bg-transparent border-b border-[#3A3530] text-[#F2EDE5] py-1.5 text-sm focus:outline-none focus:border-[#C8A96E] transition-colors w-56"
        />
      </div>

      {tags.length === 0 && (
        <p className="text-[#4A4540] text-sm italic">
          No tags in use yet. Add some on the Projects or Studio tabs.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        {filtered.map(({ tag, projects: pIds, gallery: gIds, total }) => {
          const isDup = (lowerCounts.get(tag.toLowerCase()) ?? 0) > 1;
          const renaming = renamingTag === tag;
          const merging = mergingTag === tag;
          const deleting = confirmDelete === tag;
          return (
            <div
              key={tag}
              className={`flex flex-col gap-2 border px-4 py-3 rounded ${
                isDup ? "border-[#C8A96E]/40 bg-[#C8A96E]/5" : "border-[#272421]"
              }`}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[#F2EDE5] text-sm font-medium truncate">
                    {tag}
                  </span>
                  <span className="text-[10px] text-[#8A8278] uppercase tracking-widest whitespace-nowrap">
                    {pIds.length} project{pIds.length === 1 ? "" : "s"} ·{" "}
                    {gIds.length} artwork{gIds.length === 1 ? "" : "s"}
                  </span>
                  {isDup && (
                    <span className="text-[10px] text-[#C8A96E] uppercase tracking-widest whitespace-nowrap">
                      Duplicate casing
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs uppercase tracking-widest">
                  <button
                    onClick={() => {
                      closeAll();
                      setRenamingTag(tag);
                      setRenameValue(tag);
                    }}
                    className="text-[#8A8278] hover:text-[#C8A96E] transition-colors"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      closeAll();
                      setMergingTag(tag);
                      setMergeTarget("");
                    }}
                    className="text-[#8A8278] hover:text-[#C8A96E] transition-colors"
                  >
                    Merge
                  </button>
                  <button
                    onClick={() => {
                      closeAll();
                      setConfirmDelete(tag);
                    }}
                    className="text-[#8A8278] hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {renaming && (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setRenamingTag(null);
                      if (e.key === "Enter") {
                        const v = renameValue.trim();
                        if (v && v !== tag)
                          apply(applyTagRename(projects, gallery, tag, v));
                        setRenamingTag(null);
                      }
                    }}
                    className="bg-[#0A0908] border border-[#3A3530] text-[#F2EDE5] py-1.5 px-2 text-sm focus:outline-none focus:border-[#C8A96E] transition-colors flex-1 min-w-[180px]"
                  />
                  <button
                    onClick={() => {
                      const v = renameValue.trim();
                      if (v && v !== tag)
                        apply(applyTagRename(projects, gallery, tag, v));
                      setRenamingTag(null);
                    }}
                    className="text-xs uppercase tracking-widest border border-[#C8A96E] text-[#C8A96E] px-3 py-1.5 hover:bg-[#C8A96E] hover:text-[#0A0908] transition-colors"
                  >
                    Rename {total} item{total === 1 ? "" : "s"}
                  </button>
                  <button
                    onClick={() => setRenamingTag(null)}
                    className="text-xs uppercase tracking-widest text-[#8A8278] hover:text-[#F2EDE5]"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {merging && (
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={mergeTarget}
                    onChange={(e) => setMergeTarget(e.target.value)}
                    className="bg-[#0A0908] border border-[#3A3530] text-[#F2EDE5] py-1.5 px-2 text-sm focus:outline-none focus:border-[#C8A96E] transition-colors flex-1 min-w-[180px]"
                  >
                    <option value="">Merge into…</option>
                    {tags
                      .filter((o) => o.tag !== tag)
                      .map((o) => (
                        <option key={o.tag} value={o.tag}>
                          {o.tag} ({o.total})
                        </option>
                      ))}
                  </select>
                  <button
                    disabled={!mergeTarget}
                    onClick={() => {
                      if (!mergeTarget) return;
                      apply(applyTagMerge(projects, gallery, [tag], mergeTarget));
                      setMergingTag(null);
                    }}
                    className="text-xs uppercase tracking-widest border border-[#C8A96E] text-[#C8A96E] px-3 py-1.5 hover:bg-[#C8A96E] hover:text-[#0A0908] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Merge {total} item{total === 1 ? "" : "s"}
                  </button>
                  <button
                    onClick={() => setMergingTag(null)}
                    className="text-xs uppercase tracking-widest text-[#8A8278] hover:text-[#F2EDE5]"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {deleting && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#F2EDE5] text-sm">
                    Remove "{tag}" from {total} item{total === 1 ? "" : "s"}?
                  </span>
                  <button
                    onClick={() => {
                      apply(applyTagDelete(projects, gallery, tag));
                      setConfirmDelete(null);
                    }}
                    className="text-xs uppercase tracking-widest border border-red-400 text-red-400 px-3 py-1.5 hover:bg-red-400 hover:text-[#0A0908] transition-colors"
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="text-xs uppercase tracking-widest text-[#8A8278] hover:text-[#F2EDE5]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[#8A8278] text-sm uppercase tracking-widest">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-b border-[#3A3530] text-[#F2EDE5] py-2 text-sm focus:outline-none focus:border-[#C8A96E] transition-colors"
      />
    </div>
  );
}

function TextareaInput({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[#8A8278] text-sm uppercase tracking-widest">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="bg-[#0A0908] border border-[#3A3530] text-[#F2EDE5] py-2 px-3 text-sm focus:outline-none focus:border-[#C8A96E] transition-colors resize-y"
      />
    </div>
  );
}

function CheckboxInput({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-[#C8A96E]"
      />
      <span className="text-[#8A8278] text-sm uppercase tracking-widest">{label}</span>
    </label>
  );
}

function SectionImageUploader({
  onPicked,
  accept = "image/*,video/mp4,video/webm,.gif,.mp4,.webm",
  label = "↑ Upload to library",
}: {
  onPicked: (url: string) => void;
  accept?: string;
  label?: string;
}) {
  const upload = useAssetUpload();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (!upload) return null;
  return (
    <div className="flex flex-col gap-1">
      <label
        className={`text-sm border px-3 py-1.5 uppercase tracking-widest cursor-pointer inline-flex items-center justify-center ${
          busy
            ? "border-[#3A3530] text-[#4A4540] cursor-wait"
            : "border-[#C8A96E] text-[#C8A96E] hover:bg-[#C8A96E] hover:text-[#0A0908]"
        }`}
      >
        {busy ? "Uploading…" : label}
        <input
          type="file"
          accept={accept}
          className="hidden"
          disabled={busy}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true);
            setErr("");
            try {
              const url = await upload(f);
              onPicked(url);
            } catch (e2) {
              setErr(e2 instanceof Error ? e2.message : "Upload failed.");
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {err && <p className="text-xs text-red-400">{err}</p>}
    </div>
  );
}

// Same upload-to-library control but styled as a wide dashed drop zone
// so it can sit inline with the URL text input above the cover preview.
function UploadToLibraryDashed({
  label,
  accept,
  onUploaded,
}: {
  label: string;
  accept: string;
  onUploaded: (url: string) => void;
}) {
  const upload = useAssetUpload();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (!upload) return null;
  return (
    <div className="flex flex-col gap-1 flex-1">
      <label
        className={`flex items-center gap-2 px-3 py-2 border border-dashed transition-colors rounded text-[11px] uppercase tracking-widest ${
          busy
            ? "border-[#3A3530] text-[#4A4540] cursor-wait"
            : "border-[#3A3530] hover:border-[#C8A96E] text-[#8A8278] cursor-pointer"
        }`}
      >
        <span>{busy ? "Uploading…" : label}</span>
        <input
          type="file"
          accept={accept}
          className="hidden"
          disabled={busy}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true);
            setErr("");
            try {
              const url = await upload(f);
              onUploaded(url);
            } catch (e2) {
              setErr(e2 instanceof Error ? e2.message : "Upload failed.");
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {err && <p className="text-xs text-red-400">{err}</p>}
    </div>
  );
}

function SectionsEditor({
  sections,
  onChange,
}: {
  sections: Section[];
  onChange: (s: Section[]) => void;
}) {
  const addSection = (type: SectionType) => {
    const id = String(Date.now());
    let newSec: Section;
    if (type === "text") newSec = { id, type, title: "", summary: "", body: "" };
    else if (type === "image") newSec = { id, type, src: "", caption: "" };
    else newSec = { id, type, problem: "", solution: "" };
    onChange([...sections, newSec]);
  };

  const update = (idx: number, patch: Partial<Section>) => {
    onChange(sections.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const remove = (idx: number) => onChange(sections.filter((_, i) => i !== idx));

  const move = (idx: number, dir: -1 | 1) => {
    const arr = [...sections];
    const to = idx + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    onChange(arr);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2 flex-wrap">
        {(["text", "image", "problem-solution"] as SectionType[]).map((t) => (
          <button
            key={t}
            onClick={() => addSection(t)}
            className="text-sm border border-[#C8A96E] text-[#C8A96E] px-3 py-1.5 hover:bg-[#C8A96E] hover:text-[#0A0908] transition-colors uppercase tracking-widest"
          >
            + {t}
          </button>
        ))}
      </div>

      {sections.length === 0 && (
        <p className="text-[#4A4540] text-sm italic">
          No sections yet. Add text, image, or problem-solution blocks above.
        </p>
      )}

      {sections.map((sec, idx) => (
        <div key={sec.id} className="border border-[#272421] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[#C8A96E] text-sm uppercase tracking-widest">
              {sec.type}
            </span>
            <div className="flex items-center gap-3">
              <button onClick={() => move(idx, -1)} className="text-[#4A4540] hover:text-[#F2EDE5] text-sm">↑</button>
              <button onClick={() => move(idx, 1)} className="text-[#4A4540] hover:text-[#F2EDE5] text-sm">↓</button>
              <button onClick={() => remove(idx)} className="text-[#4A4540] hover:text-red-400 text-sm">Remove</button>
            </div>
          </div>

          {sec.type === "text" && (
            <>
              <TextInput label="Section Title (left)" value={sec.title ?? ""} onChange={(v) => update(idx, { title: v })} />
              <TextInput label="Summary line (right)" value={sec.summary ?? ""} onChange={(v) => update(idx, { summary: v })} />
              <TextareaInput label="Body text (below)" value={sec.body ?? ""} onChange={(v) => update(idx, { body: v })} rows={4} />
            </>
          )}

          {sec.type === "image" && (
            <>
              <TextInput label="Image URL" value={sec.src ?? ""} onChange={(v) => update(idx, { src: v })} />
              <div className="flex items-center gap-2 flex-wrap">
                <SectionImageUploader
                  onPicked={(url) => update(idx, { src: url })}
                />
                <PickFromLibraryButton
                  type="image"
                  onPick={(url) => update(idx, { src: url })}
                />
              </div>
              <TextInput label="Caption (optional)" value={sec.caption ?? ""} onChange={(v) => update(idx, { caption: v })} />
              {sec.src && (
                <SafeImage src={sec.src} alt="" className="h-24 object-cover opacity-60 mt-1" />
              )}
            </>
          )}

          {sec.type === "problem-solution" && (
            <>
              <TextareaInput label="Problem" value={sec.problem ?? ""} onChange={(v) => update(idx, { problem: v })} rows={3} />
              <TextareaInput label="Solution" value={sec.solution ?? ""} onChange={(v) => update(idx, { solution: v })} rows={3} />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function parseFileToProject(raw: string, filename: string): Partial<Project> {
  if (filename.endsWith(".json")) {
    try {
      const parsed = JSON.parse(raw) as Partial<Project>;
      return {
        title: parsed.title ?? "",
        slug: parsed.slug ?? parsed.title?.toLowerCase().replace(/\s+/g, "-") ?? "",
        subtitle: parsed.subtitle ?? "",
        type: parsed.type ?? "Product Design",
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        description: parsed.description ?? "",
        challenge: parsed.challenge ?? "",
        solution: parsed.solution ?? "",
        impact: parsed.impact ?? "",
        coverImage: parsed.coverImage ?? "",
        year: parsed.year ?? String(new Date().getFullYear()),
        featured: parsed.featured ?? false,
        sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      };
    } catch {
      return {};
    }
  }

  const get = (label: string): string => {
    const re = new RegExp(`${label}[:\\s]+([^\\n]+(?:\\n(?![A-Z][a-z]+:)[^\\n]+)*)`, "i");
    const m = raw.match(re);
    return m ? m[1].trim() : "";
  };

  return {
    title: get("title") || get("project name") || get("name"),
    subtitle: get("subtitle") || get("tagline"),
    description: get("description") || get("overview") || get("about"),
    challenge: get("challenge") || get("problem"),
    solution: get("solution") || get("approach"),
    impact: get("impact") || get("outcome") || get("results"),
    type: get("type") || get("role") || "Product Design",
    year: get("year") || String(new Date().getFullYear()),
  };
}

function ProjectsEditor({
  data,
  onChange,
  tagSuggestions,
}: {
  data: Project[];
  onChange: (d: Project[]) => void;
  tagSuggestions: string[];
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [subTab, setSubTab] = useState<"details" | "sections">("details");

  const updateProject = (idx: number, patch: Partial<Project>) => {
    onChange(data.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const addProject = () => {
    const newProject: Project = {
      id: String(Date.now()),
      slug: "new-project",
      title: "New Project",
      subtitle: "",
      type: "Product Design",
      tags: [],
      description: "",
      challenge: "",
      solution: "",
      impact: "",
      coverImage: "",
      year: String(new Date().getFullYear()),
      featured: false,
      sections: [],
    };
    const updated = [...data, newProject];
    onChange(updated);
    setSelectedIdx(updated.length - 1);
  };

  const removeProject = (idx: number) => {
    onChange(data.filter((_, i) => i !== idx));
    setSelectedIdx(Math.max(0, idx - 1));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target?.result as string;
      const patch = parseFileToProject(raw, file.name);
      if (Object.keys(patch).length > 0) {
        updateProject(selectedIdx, patch);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const project = data[selectedIdx];

  return (
    <div className="flex gap-6 h-full">
      <div className="w-44 flex-shrink-0 flex flex-col gap-2">
        <button
          onClick={addProject}
          className="text-sm border border-[#C8A96E] text-[#C8A96E] px-3 py-2 hover:bg-[#C8A96E] hover:text-[#0A0908] transition-colors uppercase tracking-widest mb-2"
        >
          + Add Project
        </button>
        <AdminSortableList
          items={data}
          onReorder={(newArr) => {
            const selectedId = data[selectedIdx]?.id;
            onChange(newArr);
            if (selectedId) {
              const newIdx = newArr.findIndex((p) => p.id === selectedId);
              if (newIdx !== -1) setSelectedIdx(newIdx);
            }
          }}
          renderItem={(p, i, dragHandle) => (
            <div className="flex items-center gap-1">
              {dragHandle}
              <button
                onClick={() => { setSelectedIdx(i); setSubTab("details"); }}
                className={`flex-1 text-left text-sm px-2 py-2 truncate transition-colors ${
                  i === selectedIdx
                    ? "bg-[#C8A96E] text-[#0A0908]"
                    : "text-[#8A8278] hover:text-[#F2EDE5] border border-[#272421] hover:border-[#3A3530]"
                }`}
              >
                {p.title}
              </button>
            </div>
          )}
        />
      </div>

      {project && (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-3">
              {(["details", "sections"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSubTab(t)}
                  className={`text-sm uppercase tracking-widest transition-colors pb-1 ${
                    subTab === t
                      ? "text-[#C8A96E] border-b border-[#C8A96E]"
                      : "text-[#4A4540] hover:text-[#8A8278]"
                  }`}
                >
                  {t} {t === "sections" && `(${project.sections?.length ?? 0})`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-[#C8A96E] border border-[#C8A96E] px-2 py-1 cursor-pointer hover:bg-[#C8A96E] hover:text-[#0A0908] transition-colors uppercase tracking-widest">
                Upload JSON / TXT
                <input
                  type="file"
                  accept=".json,.txt,.md"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
              <button
                onClick={() => removeProject(selectedIdx)}
                className="text-sm text-[#4A4540] hover:text-red-400 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          {subTab === "details" && (
            <div className="flex flex-col gap-5">
              <TextInput label="Title" value={project.title} onChange={(v) => updateProject(selectedIdx, { title: v })} />
              <TextInput label="Slug (URL path)" value={project.slug} onChange={(v) => updateProject(selectedIdx, { slug: v })} />
              <TextInput label="Subtitle" value={project.subtitle} onChange={(v) => updateProject(selectedIdx, { subtitle: v })} />
              <TextInput label="Type" value={project.type} onChange={(v) => updateProject(selectedIdx, { type: v })} />
              <TextInput label="Year" value={project.year} onChange={(v) => updateProject(selectedIdx, { year: v })} />
              {/* Cover image / video upload */}
              <div className="flex flex-col gap-2">
                <label className="text-[#8A8278] text-xs uppercase tracking-widest">Cover Image / Video</label>
                <input
                  type="text"
                  value={project.coverImage}
                  onChange={(e) => updateProject(selectedIdx, { coverImage: e.target.value })}
                  placeholder="Paste URL (jpg, png, gif, mp4…)"
                  className="bg-transparent border-b border-[#3A3530] text-[#F2EDE5] py-2 text-sm focus:outline-none focus:border-[#C8A96E] transition-colors"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <UploadToLibraryDashed
                    label="↑ Upload file — image / gif / mp4"
                    accept="image/*,video/mp4,video/webm,.gif,.mp4,.webm"
                    onUploaded={(url) =>
                      updateProject(selectedIdx, { coverImage: url })
                    }
                  />
                  <PickFromLibraryButton
                    onPick={(url) => updateProject(selectedIdx, { coverImage: url })}
                  />
                </div>
                {project.coverImage && (
                  <div className="rounded overflow-hidden border border-[#3A3530]" style={{ maxHeight: "130px" }}>
                    {/\.(mp4|webm|ogg|mov)(\?|$)/i.test(project.coverImage) || project.coverImage.startsWith("data:video") ? (
                      <video src={project.coverImage} autoPlay loop muted playsInline className="w-full object-cover" style={{ maxHeight: "130px" }} />
                    ) : (
                      <SafeImage src={project.coverImage} alt="cover preview" className="w-full object-cover" style={{ maxHeight: "130px" }} />
                    )}
                  </div>
                )}
              </div>
              <TagsInput
                label="Tags"
                tags={project.tags ?? []}
                suggestions={tagSuggestions}
                onChange={(tags) => updateProject(selectedIdx, { tags })}
              />
              <TextareaInput label="Description / Overview" value={project.description} onChange={(v) => updateProject(selectedIdx, { description: v })} />
              <TextareaInput label="Challenge / Problem" value={project.challenge} onChange={(v) => updateProject(selectedIdx, { challenge: v })} />
              <TextareaInput label="Solution / Approach" value={project.solution} onChange={(v) => updateProject(selectedIdx, { solution: v })} />
              <TextareaInput label="Impact / Outcomes" value={project.impact} onChange={(v) => updateProject(selectedIdx, { impact: v })} />
              <CheckboxInput label="★ Show on homepage Selected Work" checked={project.featured} onChange={(v) => updateProject(selectedIdx, { featured: v })} />
            </div>
          )}

          {subTab === "sections" && (
            <SectionsEditor
              sections={project.sections ?? []}
              onChange={(s) => updateProject(selectedIdx, { sections: s })}
            />
          )}
        </div>
      )}
    </div>
  );
}

function AboutEditor({
  data,
  onChange,
}: {
  data: About;
  onChange: (d: About) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <label className="text-[#8A8278] text-sm uppercase tracking-widest">Bio Paragraphs</label>
        {data.bio.map((para, i) => (
          <div key={i} className="relative">
            <textarea
              value={para}
              onChange={(e) => {
                const updated = [...data.bio];
                updated[i] = e.target.value;
                onChange({ ...data, bio: updated });
              }}
              rows={3}
              className="w-full bg-[#0A0908] border border-[#3A3530] text-[#F2EDE5] py-2 px-3 text-sm focus:outline-none focus:border-[#C8A96E] transition-colors resize-y"
            />
            <button
              onClick={() => onChange({ ...data, bio: data.bio.filter((_, j) => j !== i) })}
              className="absolute top-2 right-2 text-[#4A4540] hover:text-red-400 text-sm"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange({ ...data, bio: [...data.bio, ""] })}
          className="self-start text-sm border border-[#C8A96E] text-[#C8A96E] px-3 py-2 hover:bg-[#C8A96E] hover:text-[#0A0908] transition-colors uppercase tracking-widest"
        >
          + Add Paragraph
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[#8A8278] text-sm uppercase tracking-widest">
          Skills (JSON format — array of {"{category, items[]}"}
          )
        </label>
        <textarea
          value={JSON.stringify(data.skills, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value) as SkillGroup[];
              onChange({ ...data, skills: parsed });
            } catch {
              // ignore parse errors while typing
            }
          }}
          rows={12}
          className="w-full bg-[#0A0908] border border-[#3A3530] text-[#F2EDE5] py-2 px-3 text-sm font-mono focus:outline-none focus:border-[#C8A96E] transition-colors resize-y"
        />
      </div>
    </div>
  );
}

function ExperienceEditor({
  data,
  onChange,
}: {
  data: ExperienceItem[];
  onChange: (d: ExperienceItem[]) => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const update = (idx: number, patch: Partial<ExperienceItem>) => {
    onChange(data.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    const newItem: ExperienceItem = {
      id: String(Date.now()),
      role: "New Role",
      company: "Company",
      location: "",
      period: "2024 — Present",
      bullets: [],
    };
    const updated = [...data, newItem];
    onChange(updated);
    setSelectedIdx(updated.length - 1);
  };

  const removeItem = (idx: number) => {
    onChange(data.filter((_, i) => i !== idx));
    setSelectedIdx(Math.max(0, idx - 1));
  };

  const item = data[selectedIdx];

  return (
    <div className="flex gap-6">
      <div className="w-48 flex-shrink-0 flex flex-col gap-2">
        <button
          onClick={addItem}
          className="text-sm border border-[#C8A96E] text-[#C8A96E] px-3 py-2 hover:bg-[#C8A96E] hover:text-[#0A0908] transition-colors uppercase tracking-widest mb-2"
        >
          + Add
        </button>
        <AdminSortableList
          items={data}
          onReorder={(newArr) => {
            const selectedId = data[selectedIdx]?.id;
            onChange(newArr);
            if (selectedId) {
              const newIdx = newArr.findIndex((e) => e.id === selectedId);
              if (newIdx !== -1) setSelectedIdx(newIdx);
            }
          }}
          renderItem={(exp, i, dragHandle) => (
            <div className="flex items-center gap-1">
              {dragHandle}
              <button
                onClick={() => setSelectedIdx(i)}
                className={`flex-1 text-left text-sm px-2 py-2 truncate transition-colors ${
                  i === selectedIdx
                    ? "bg-[#C8A96E] text-[#0A0908]"
                    : "text-[#8A8278] hover:text-[#F2EDE5] border border-[#272421]"
                }`}
              >
                {exp.role}
              </button>
            </div>
          )}
        />
      </div>
      {item && (
        <div className="flex-1 flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <span className="text-[#C8A96E] text-sm uppercase tracking-widest">{item.role}</span>
            <button
              onClick={() => removeItem(selectedIdx)}
              className="text-sm text-[#4A4540] hover:text-red-400"
            >
              Remove
            </button>
          </div>
          <TextInput
            label="Role / Title"
            value={item.role}
            onChange={(v) => update(selectedIdx, { role: v })}
          />
          <TextInput
            label="Company"
            value={item.company}
            onChange={(v) => update(selectedIdx, { company: v })}
          />
          <TextInput
            label="Location (e.g. Toronto)"
            value={item.location ?? ""}
            onChange={(v) => update(selectedIdx, { location: v })}
          />
          <TextInput
            label="Period (e.g. 2022 — Present)"
            value={item.period}
            onChange={(v) => update(selectedIdx, { period: v })}
          />
          <TextareaInput
            label="Bullets (one per line)"
            value={(item.bullets ?? []).join("\n")}
            onChange={(v) =>
              update(selectedIdx, {
                bullets: v.split("\n").map((b) => b.trim()).filter(Boolean),
              })
            }
            rows={6}
          />
        </div>
      )}
    </div>
  );
}

function EducationEditor({
  data,
  onChange,
}: {
  data: EducationItem[];
  onChange: (d: EducationItem[]) => void;
}) {
  const addItem = () => {
    onChange([
      ...data,
      { id: String(Date.now()), degree: "New Degree", institution: "University", year: "2024" },
    ]);
  };

  const update = (idx: number, patch: Partial<EducationItem>) => {
    onChange(data.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  return (
    <div className="flex flex-col gap-8">
      <AdminSortableList
        items={data}
        onReorder={onChange}
        renderItem={(item, idx, dragHandle) => (
          <div className="border border-[#272421] p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {dragHandle}
                <span className="text-[#C8A96E] text-sm uppercase tracking-widest">
                  Entry {idx + 1}
                </span>
              </div>
              <button
                onClick={() => onChange(data.filter((_, i) => i !== idx))}
                className="text-sm text-[#4A4540] hover:text-red-400"
              >
                Remove
              </button>
            </div>
            <TextInput
              label="Degree"
              value={item.degree}
              onChange={(v) => update(idx, { degree: v })}
            />
            <TextInput
              label="Institution"
              value={item.institution}
              onChange={(v) => update(idx, { institution: v })}
            />
            <TextInput
              label="Year"
              value={item.year}
              onChange={(v) => update(idx, { year: v })}
            />
          </div>
        )}
      />
      <button
        onClick={addItem}
        className="self-start text-sm border border-[#C8A96E] text-[#C8A96E] px-3 py-2 hover:bg-[#C8A96E] hover:text-[#0A0908] transition-colors uppercase tracking-widest"
      >
        + Add Education
      </button>
    </div>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => resolve(ev.target?.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Read an image file and return a downscaled JPEG/PNG data URL so we
 * don't ship multi-MB camera originals into the JSON payload (which
 * would blow past the API server's body limit and bloat gallery.json).
 *
 * - Non-image files (videos, etc.) and SVGs fall back to the raw
 *   data URL since canvas re-encoding doesn't help / would break them.
 * - Images are scaled so neither edge exceeds `maxEdge` (default 2000px),
 *   preserving aspect ratio. Already-small images are returned as-is.
 * - Output is JPEG quality 0.85 unless the source is a PNG with
 *   transparency, in which case PNG is preserved.
 */
async function readImageDownscaled(
  file: File,
  maxEdge = 2000,
): Promise<string> {
  const raw = await readFileAsDataUrl(file);
  if (!file.type.startsWith("image/")) return raw;
  if (file.type === "image/svg+xml" || file.type === "image/gif") return raw;

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width: w, height: h } = img;
      const longest = Math.max(w, h);
      const scale = longest > maxEdge ? maxEdge / longest : 1;
      // No resize and the original is already reasonable → keep as-is.
      if (scale === 1 && raw.length < 1_500_000) {
        resolve(raw);
        return;
      }
      const tw = Math.round(w * scale);
      const th = Math.round(h * scale);
      const canvas = document.createElement("canvas");
      canvas.width = tw;
      canvas.height = th;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(raw);
        return;
      }
      ctx.drawImage(img, 0, 0, tw, th);
      const isPng = file.type === "image/png";
      const out = isPng
        ? canvas.toDataURL("image/png")
        : canvas.toDataURL("image/jpeg", 0.85);
      // If re-encoding made it bigger (rare), prefer the smaller original.
      resolve(out.length < raw.length ? out : raw);
    };
    img.onerror = () => resolve(raw);
    img.src = raw;
  });
}

function GalleryEditor({
  data,
  onChange,
  tagSuggestions,
}: {
  data: GalleryItem[];
  onChange: (d: GalleryItem[]) => void;
  tagSuggestions: string[];
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const update = (idx: number, patch: Partial<GalleryItem>) => {
    onChange(data.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const updateWithSlug = (idx: number, title: string) => {
    const item = data[idx];
    if (!item) return;
    const currentSlug = item.slug ?? "";
    const expectedFromOldTitle = slugify(item.title ?? "");
    // Auto-update slug only when it still matches the previous title's slug
    // (i.e. user has not manually customised it).
    const shouldAutoSlug = !currentSlug || currentSlug === expectedFromOldTitle;
    update(idx, {
      title,
      ...(shouldAutoSlug ? { slug: slugify(title) } : {}),
    });
  };

  const slugConflict = (slug: string, idx: number): boolean =>
    data.some((it, i) => i !== idx && it.slug === slug);

  const addItem = () => {
    const maxOrder = data.reduce((m, it) => Math.max(m, it.order ?? 0), 0);
    const newItem: GalleryItem = {
      id: String(Date.now()),
      kind: "big",
      slug: `new-item-${Date.now()}`,
      title: "New Item",
      role: "",
      year: String(new Date().getFullYear()),
      description: "",
      tags: [],
      coverImage: "",
      images: [],
      order: maxOrder + 1,
    };
    const updated = [...data, newItem];
    onChange(updated);
    setSelectedIdx(updated.length - 1);
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const arr = [...data].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    const pos = arr.findIndex((x) => x.id === data[idx].id);
    const to = pos + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[pos], arr[to]] = [arr[to], arr[pos]];
    arr.forEach((it, i) => {
      it.order = i + 1;
    });
    onChange(arr);
    setSelectedIdx(data.findIndex((x) => x.id === arr[to].id));
  };

  const item = data[selectedIdx];

  return (
    <div className="flex gap-6">
      <div className="w-56 flex-shrink-0 flex flex-col gap-2">
        <button
          onClick={addItem}
          className="text-sm border border-[#C8A96E] text-[#C8A96E] px-3 py-2 hover:bg-[#C8A96E] hover:text-[#0A0908] transition-colors uppercase tracking-widest mb-2"
        >
          + Add Gallery Item
        </button>
        {(["big", "small"] as const).map((kind) => {
          const group = data.filter((g) => (g.kind ?? "big") === kind);
          if (group.length === 0) return null;
          const heading =
            kind === "big" ? "Big Projects" : "Artworks (slideshow)";
          return (
            <div key={kind} className="flex flex-col gap-1.5 mt-3 first:mt-0">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#C8A96E] px-1 pt-1 pb-1">
                {heading} ({group.length})
              </div>
              <AdminSortableList
                items={group}
                onReorder={(reorderedGroup) => {
                  const selectedId = data[selectedIdx]?.id;
                  const positions = data.reduce<number[]>((acc, item, i) => {
                    if ((item.kind ?? "big") === kind) acc.push(i);
                    return acc;
                  }, []);
                  const newData = [...data];
                  positions.forEach((pos, i) => {
                    newData[pos] = reorderedGroup[i]!;
                  });
                  onChange(newData);
                  if (selectedId) {
                    const newIdx = newData.findIndex((x) => x.id === selectedId);
                    if (newIdx !== -1) setSelectedIdx(newIdx);
                  }
                }}
                renderItem={(g, _groupIdx, dragHandle) => {
                  const i = data.findIndex((x) => x.id === g.id);
                  return (
                    <div className="flex items-center gap-1">
                      {dragHandle}
                      <button
                        onClick={() => setSelectedIdx(i)}
                        className={`flex-1 text-left text-sm px-2 py-2 truncate transition-colors ${
                          i === selectedIdx
                            ? "bg-[#C8A96E] text-[#0A0908]"
                            : "text-[#8A8278] hover:text-[#F2EDE5] border border-[#272421]"
                        }`}
                        title={g.title}
                      >
                        {g.title}
                        {g.linkUrl && (
                          <span className="ml-2 opacity-70" title="Has external link">
                            ↗
                          </span>
                        )}
                      </button>
                    </div>
                  );
                }}
              />
            </div>
          );
        })}
      </div>
      {item && (
        <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-2">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <span className="text-[#C8A96E] text-sm uppercase tracking-widest">
              {item.title}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => moveItem(selectedIdx, -1)}
                className="text-[#8A8278] hover:text-[#F2EDE5] text-sm"
                title="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => moveItem(selectedIdx, 1)}
                className="text-[#8A8278] hover:text-[#F2EDE5] text-sm"
                title="Move down"
              >
                ↓
              </button>
              <button
                onClick={() => {
                  onChange(data.filter((_, i) => i !== selectedIdx));
                  setSelectedIdx(Math.max(0, selectedIdx - 1));
                }}
                className="text-sm text-[#4A4540] hover:text-red-400"
              >
                Remove
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[#8A8278] text-xs uppercase tracking-widest">
              Section
            </label>
            <div className="flex gap-2">
              {(["big", "small"] as const).map((k) => {
                const active = (item.kind ?? "big") === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => update(selectedIdx, { kind: k })}
                    className={`text-xs uppercase tracking-widest px-3 py-1.5 border transition-colors ${
                      active
                        ? "bg-[#C8A96E] text-[#0A0908] border-[#C8A96E]"
                        : "text-[#8A8278] border-[#3A3530] hover:border-[#C8A96E]"
                    }`}
                  >
                    {k === "big" ? "Big Project" : "Artwork (slideshow)"}
                  </button>
                );
              })}
            </div>
            <span className="text-[#4A4540] text-[11px] font-sans">
              Big Projects appear in the masonry with a detail page; Artworks
              appear in the horizontal slideshow with a popup.
            </span>
          </div>

          <TextInput
            label="Title"
            value={item.title}
            onChange={(v) => updateWithSlug(selectedIdx, v)}
          />
          <div className="flex flex-col gap-1">
            <TextInput
              label="Slug (URL: /studio/<slug>)"
              value={item.slug ?? ""}
              onChange={(v) => update(selectedIdx, { slug: slugify(v) })}
            />
            {item.slug && slugConflict(item.slug, selectedIdx) && (
              <span className="text-red-400 text-xs">
                Slug already used by another item — must be unique.
              </span>
            )}
          </div>
          <TextInput
            label="Role / Discipline"
            value={item.role}
            onChange={(v) => update(selectedIdx, { role: v })}
          />
          <TextInput
            label="Year"
            value={item.year ?? ""}
            onChange={(v) => update(selectedIdx, { year: v })}
          />
          <TextInput
            label="Display order"
            value={String(item.order ?? "")}
            onChange={(v) => {
              const n = parseInt(v, 10);
              update(selectedIdx, { order: Number.isFinite(n) ? n : undefined });
            }}
          />
          <TextareaInput
            label="Description"
            value={item.description ?? ""}
            onChange={(v) => update(selectedIdx, { description: v })}
            rows={4}
          />
          <TagsInput
            label="Tags"
            tags={item.tags ?? []}
            suggestions={tagSuggestions}
            onChange={(tags) => update(selectedIdx, { tags })}
          />

          {/* External hyperlink */}
          <div className="flex flex-col gap-2 border border-[#272421] rounded p-3">
            <label className="text-[#8A8278] text-xs uppercase tracking-widest">
              External Hyperlink (optional)
            </label>
            <TextInput
              label="Link URL (Behance, Vimeo, live site, etc.)"
              value={item.linkUrl ?? ""}
              onChange={(v) => update(selectedIdx, { linkUrl: v })}
            />
            <TextInput
              label='Link button label (default: "View project")'
              value={item.linkLabel ?? ""}
              onChange={(v) => update(selectedIdx, { linkLabel: v })}
            />
            <span className="text-[#4A4540] text-[11px] font-sans">
              Shown as a button on the public Studio detail page (big
              projects) or in the artwork popup (artworks). Leave blank to
              hide the button.
            </span>
          </div>

          {/* Cover image */}
          <div className="flex flex-col gap-2">
            <label className="text-[#8A8278] text-xs uppercase tracking-widest">
              Cover Image
            </label>
            <input
              type="text"
              value={item.coverImage}
              onChange={(e) => update(selectedIdx, { coverImage: e.target.value })}
              placeholder="Paste image URL"
              className="bg-transparent border-b border-[#3A3530] text-[#F2EDE5] py-2 text-sm focus:outline-none focus:border-[#C8A96E] transition-colors"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <UploadToLibraryDashed
                label="↑ Upload cover image"
                accept="image/*"
                onUploaded={(url) => update(selectedIdx, { coverImage: url })}
              />
              <PickFromLibraryButton
                type="image"
                onPick={(url) => update(selectedIdx, { coverImage: url })}
              />
            </div>
            {item.coverImage && (
              <div
                className="rounded overflow-hidden border border-[#3A3530]"
                style={{ maxHeight: "150px" }}
              >
                <SafeImage
                  src={item.coverImage}
                  alt="cover preview"
                  className="w-full object-cover"
                  style={{ maxHeight: "150px" }}
                />
              </div>
            )}
          </div>

          {/* Additional images */}
          <div className="flex flex-col gap-3">
            <label className="text-[#8A8278] text-xs uppercase tracking-widest">
              Additional Images
            </label>
            {(item.images ?? []).map((src, i) => (
              <div
                key={i}
                className="flex items-start gap-3 border border-[#272421] p-3 rounded"
              >
                {src && (
                  <SafeImage
                    src={src}
                    alt=""
                    className="w-20 h-20 object-cover rounded flex-shrink-0"
                    fallbackAspect="16 / 5"
                  />
                )}
                <input
                  type="text"
                  value={src}
                  onChange={(e) => {
                    const arr = [...(item.images ?? [])];
                    arr[i] = e.target.value;
                    update(selectedIdx, { images: arr });
                  }}
                  className="flex-1 bg-transparent border-b border-[#3A3530] text-[#F2EDE5] py-1 text-sm focus:outline-none focus:border-[#C8A96E]"
                />
                <button
                  onClick={() => {
                    const arr = (item.images ?? []).filter((_, j) => j !== i);
                    update(selectedIdx, { images: arr });
                  }}
                  className="text-sm text-[#4A4540] hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() =>
                  update(selectedIdx, {
                    images: [...(item.images ?? []), ""],
                  })
                }
                className="text-sm border border-[#C8A96E] text-[#C8A96E] px-3 py-1.5 hover:bg-[#C8A96E] hover:text-[#0A0908] transition-colors uppercase tracking-widest"
              >
                + Add URL
              </button>
              <SectionImageUploader
                onPicked={(url) =>
                  update(selectedIdx, {
                    images: [...(item.images ?? []), url],
                  })
                }
              />
              <PickFromLibraryButton
                type="image"
                label="From library"
                onPick={(url) =>
                  update(selectedIdx, {
                    images: [...(item.images ?? []), url],
                  })
                }
              />
            </div>
          </div>

          {/* Image layout */}
          <div className="flex flex-col gap-2 border border-[#272421] rounded p-3">
            <label className="text-[#8A8278] text-xs uppercase tracking-widest">
              Image layout
            </label>
            <RadioGroup
              value={String(item.imageColumns ?? 2)}
              onValueChange={(v) =>
                update(selectedIdx, { imageColumns: Number(v) as 1 | 2 })
              }
              className="flex gap-6"
            >
              {([1, 2] as const).map((cols) => (
                <label
                  key={cols}
                  className="flex items-center gap-2 cursor-pointer text-sm text-[#F2EDE5]"
                >
                  <RadioGroupItem
                    value={String(cols)}
                    className="border-[#8A8278] text-[#C8A96E]"
                  />
                  {cols === 1 ? "1 column" : "2 columns"}
                </label>
              ))}
            </RadioGroup>
            <span className="text-[#4A4540] text-[11px] font-sans">
              Controls how the additional images grid renders on the Studio
              detail page. 1 column = full-width editorial; 2 columns =
              side-by-side.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function IdentityContactEditor({
  identity,
  contact,
  onIdentityChange,
  onContactChange,
}: {
  identity: Identity;
  contact: Contact;
  onIdentityChange: (next: Identity) => void;
  onContactChange: (next: Contact) => void;
}) {
  const updateSocial = (i: number, patch: Partial<SocialLink>) => {
    const next = [...(contact.socials ?? [])];
    next[i] = { ...next[i], ...patch };
    onContactChange({ ...contact, socials: next });
  };
  const removeSocial = (i: number) => {
    const next = (contact.socials ?? []).filter((_, idx) => idx !== i);
    onContactChange({ ...contact, socials: next });
  };
  const addSocial = () => {
    onContactChange({
      ...contact,
      socials: [...(contact.socials ?? []), { label: "", href: "" }],
    });
  };

  const fieldClass =
    "bg-transparent border-b border-[#3A3530] text-[#F2EDE5] py-2 focus:outline-none focus:border-[#C8A96E] transition-colors";
  const labelClass = "text-[#8A8278] text-xs uppercase tracking-widest";

  return (
    <div className="flex flex-col gap-10">
      {/* Identity */}
      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-2xl text-[#F2EDE5]">Identity</h2>
        <p className="text-[#8A8278] text-sm">
          Your name and role appear in the navigation, footer, home hero, and case-study sidebar.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Full name</label>
            <input
              type="text"
              value={identity.name}
              onChange={(e) => onIdentityChange({ ...identity, name: e.target.value })}
              className={fieldClass}
            />
            <span className="text-[#4A4540] text-xs">
              On the home hero, the first word renders in brand blue and the rest in foreground.
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Role / title</label>
            <input
              type="text"
              value={identity.role}
              onChange={(e) => onIdentityChange({ ...identity, role: e.target.value })}
              className={fieldClass}
            />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="flex flex-col gap-4 border-t border-[#272421] pt-8">
        <h2 className="font-serif text-2xl text-[#F2EDE5]">Contact</h2>
        <p className="text-[#8A8278] text-sm">
          Used by the contact page, footer, and case-study sidebar. Empty fields hide automatically.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={contact.email}
              onChange={(e) => onContactChange({ ...contact, email: e.target.value })}
              className={fieldClass}
              placeholder="you@example.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Phone</label>
            <input
              type="text"
              value={contact.phone}
              onChange={(e) => onContactChange({ ...contact, phone: e.target.value })}
              className={fieldClass}
              placeholder="416-555-0100"
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className={labelClass}>Location</label>
            <input
              type="text"
              value={contact.location}
              onChange={(e) => onContactChange({ ...contact, location: e.target.value })}
              className={fieldClass}
              placeholder="City, Region, Country"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <div className="flex items-center justify-between">
            <label className={labelClass}>Social links</label>
            <button
              type="button"
              onClick={addSocial}
              className="text-sm border border-[#C8A96E] text-[#C8A96E] px-3 py-1.5 hover:bg-[#C8A96E] hover:text-[#0A0908] transition-colors uppercase tracking-widest"
            >
              + Add link
            </button>
          </div>
          {(contact.socials ?? []).length === 0 && (
            <p className="text-[#4A4540] text-xs">No social links yet.</p>
          )}
          {(contact.socials ?? []).map((s, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3 items-end border border-[#272421] p-3">
              <div className="flex flex-col gap-1">
                <span className="text-[#4A4540] text-[10px] uppercase tracking-widest">Label</span>
                <input
                  type="text"
                  value={s.label}
                  onChange={(e) => updateSocial(i, { label: e.target.value })}
                  className={fieldClass}
                  placeholder="LinkedIn"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[#4A4540] text-[10px] uppercase tracking-widest">URL</span>
                <input
                  type="url"
                  value={s.href}
                  onChange={(e) => updateSocial(i, { href: e.target.value })}
                  className={fieldClass}
                  placeholder="https://…"
                />
              </div>
              <button
                type="button"
                onClick={() => removeSocial(i)}
                className="text-sm border border-[#3A3530] text-[#8A8278] px-3 py-1.5 hover:border-red-400 hover:text-red-400 transition-colors uppercase tracking-widest"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FilesEditor({
  data,
  onChange,
  sessionToken,
}: {
  data: Files;
  onChange: (next: Files) => void;
  sessionToken: string;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const resume = data.resume ?? { url: "", filename: "", updatedAt: "" };
  const previewHref = (() => {
    const raw = (resume.url ?? "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return import.meta.env.BASE_URL + raw.replace(/^\/+/, "");
  })();
  const updatedLabel = (resume.updatedAt ?? "").trim()
    ? new Date(resume.updatedAt).toLocaleString()
    : "Bundled with site (never replaced)";

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!sessionToken) {
      setStatus("error");
      setErrorMsg("Session expired — please log out and back in.");
      return;
    }
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setStatus("error");
      setErrorMsg("Please choose a PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus("error");
      setErrorMsg("PDF must be 10 MB or smaller.");
      return;
    }
    setStatus("uploading");
    setErrorMsg("");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const url = `${import.meta.env.BASE_URL}api/admin/resume`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: sessionToken, dataUrl, filename: file.name }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        url?: string;
        filename?: string;
        updatedAt?: string;
        error?: string;
      };
      if (!res.ok || !body.url) {
        throw new Error(body.error ?? `Upload failed (${res.status}).`);
      }
      onChange({
        ...data,
        resume: {
          url: body.url,
          filename: body.filename ?? file.name,
          updatedAt: body.updatedAt ?? new Date().toISOString(),
        },
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-2xl text-[#F2EDE5]">Resume PDF</h2>
        <p className="text-[#8A8278] text-sm">
          Replaces the file behind the "Download Resume" button on the About page. The public link stays the same so old links keep working.
        </p>
      </section>

      <div className="border border-[#272421] p-5 flex flex-col gap-3 bg-[#0A0908]">
        <div className="flex flex-col gap-1">
          <span className="text-[#4A4540] text-[10px] uppercase tracking-widest">Current file</span>
          <span className="text-[#F2EDE5] text-sm">{(resume.filename ?? "").trim() || "Lenna_Hua_Resume.pdf"}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[#4A4540] text-[10px] uppercase tracking-widest">Last updated</span>
          <span className="text-[#8A8278] text-sm">{updatedLabel}</span>
        </div>
        {previewHref && (
          <a
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#C8A96E] text-sm uppercase tracking-widest hover:underline self-start"
          >
            ↗ Preview / download
          </a>
        )}
      </div>

      <label className="flex items-center justify-center gap-3 cursor-pointer px-6 py-4 border-2 border-dashed border-[#3A3530] hover:border-[#C8A96E] transition-colors rounded text-[#8A8278] text-sm uppercase tracking-widest">
        <span>{status === "uploading" ? "Uploading…" : "↑ Upload new resume PDF (max 10 MB)"}</span>
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          disabled={status === "uploading"}
          onChange={handleUpload}
        />
      </label>

      {status === "success" && (
        <p className="text-[#C8A96E] text-sm">
          Resume replaced. Click <strong>Save to Site</strong> to record the new metadata.
        </p>
      )}
      {status === "error" && (
        <p className="text-red-400 text-sm">{errorMsg || "Upload failed."}</p>
      )}
    </div>
  );
}

function HomepageEditor({
  data,
  onChange,
}: {
  data: Homepage;
  onChange: (next: Homepage) => void;
}) {
  const updateEntry = (patch: Partial<Homepage["entry"]>) =>
    onChange({ ...data, entry: { ...data.entry, ...patch } });
  const updateDesignCard = (patch: Partial<EntryCard>) =>
    updateEntry({ designCard: { ...data.entry.designCard, ...patch } });
  const updateArtCard = (patch: Partial<EntryCard>) =>
    updateEntry({ artCard: { ...data.entry.artCard, ...patch } });
  const updateHome = (patch: Partial<Homepage["home"]>) =>
    onChange({ ...data, home: { ...data.home, ...patch } });

  return (
    <div className="flex flex-col gap-10 max-w-3xl">
      <section className="flex flex-col gap-5">
        <h2 className="font-serif text-2xl text-[#F2EDE5]">Entry / Splash Page</h2>
        <p className="text-[#8A8278] text-sm">
          The dark splash screen visitors see at the very root URL — top wordmark, two big choice cards, and the prompt at the bottom.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput
            label="Wordmark"
            value={data.entry.wordmarkPrefix}
            onChange={(v) => updateEntry({ wordmarkPrefix: v })}
          />
          <TextInput
            label="Wordmark accent (e.g. .)"
            value={data.entry.wordmarkSuffix}
            onChange={(v) => updateEntry({ wordmarkSuffix: v })}
          />
        </div>
        <TextInput
          label="Top-right tagline"
          value={data.entry.topbarTagline}
          onChange={(v) => updateEntry({ topbarTagline: v })}
        />
        <TextInput
          label="Bottom prompt"
          value={data.entry.bottomPrompt}
          onChange={(v) => updateEntry({ bottomPrompt: v })}
        />

        <div className="border border-[#272421] p-4 flex flex-col gap-3">
          <span className="text-[#C8A96E] text-sm uppercase tracking-widest">Left card — Product / Design</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextInput label="Number" value={data.entry.designCard.number} onChange={(v) => updateDesignCard({ number: v })} />
            <TextInput label="Title line 1" value={data.entry.designCard.titleLine1} onChange={(v) => updateDesignCard({ titleLine1: v })} />
            <TextInput label="Title line 2" value={data.entry.designCard.titleLine2} onChange={(v) => updateDesignCard({ titleLine2: v })} />
          </div>
          <TextareaInput label="Description" value={data.entry.designCard.description} onChange={(v) => updateDesignCard({ description: v })} rows={2} />
        </div>

        <div className="border border-[#272421] p-4 flex flex-col gap-3">
          <span className="text-[#C8A96E] text-sm uppercase tracking-widest">Right card — Art / Creative</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextInput label="Number" value={data.entry.artCard.number} onChange={(v) => updateArtCard({ number: v })} />
            <TextInput label="Title line 1" value={data.entry.artCard.titleLine1} onChange={(v) => updateArtCard({ titleLine1: v })} />
            <TextInput label="Title line 2" value={data.entry.artCard.titleLine2} onChange={(v) => updateArtCard({ titleLine2: v })} />
          </div>
          <TextareaInput label="Description" value={data.entry.artCard.description} onChange={(v) => updateArtCard({ description: v })} rows={2} />
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="font-serif text-2xl text-[#F2EDE5]">Home Page</h2>
        <p className="text-[#8A8278] text-sm">
          The main home page (after entering). Your name and bio are edited under Identity & Contact and About.
        </p>

        <TextInput
          label="Hero eyebrow line"
          value={data.home.heroEyebrow}
          onChange={(v) => updateHome({ heroEyebrow: v })}
        />
        <TextareaInput
          label="Hero intro paragraph"
          value={data.home.heroIntro}
          onChange={(v) => updateHome({ heroIntro: v })}
          rows={4}
        />

        <div className="border border-[#272421] p-4 flex flex-col gap-3">
          <span className="text-[#C8A96E] text-sm uppercase tracking-widest">Hero buttons</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput label="Primary label" value={data.home.primaryCtaLabel} onChange={(v) => updateHome({ primaryCtaLabel: v })} />
            <TextInput label="Primary link" value={data.home.primaryCtaHref} onChange={(v) => updateHome({ primaryCtaHref: v })} />
            <TextInput label="Secondary label" value={data.home.secondaryCtaLabel} onChange={(v) => updateHome({ secondaryCtaLabel: v })} />
            <TextInput label="Secondary link" value={data.home.secondaryCtaHref} onChange={(v) => updateHome({ secondaryCtaHref: v })} />
          </div>
        </div>

        <div className="border border-[#272421] p-4 flex flex-col gap-3">
          <span className="text-[#C8A96E] text-sm uppercase tracking-widest">Selected Work band</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput label="Heading" value={data.home.selectedWorkHeading} onChange={(v) => updateHome({ selectedWorkHeading: v })} />
            <TextInput label='"View all" link label' value={data.home.selectedWorkLinkLabel} onChange={(v) => updateHome({ selectedWorkLinkLabel: v })} />
          </div>
        </div>

        <div className="border border-[#272421] p-4 flex flex-col gap-3">
          <span className="text-[#C8A96E] text-sm uppercase tracking-widest">Approach band</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput label="Eyebrow" value={data.home.aboutEyebrow} onChange={(v) => updateHome({ aboutEyebrow: v })} />
            <TextInput label="Heading" value={data.home.aboutHeading} onChange={(v) => updateHome({ aboutHeading: v })} />
          </div>
          <TextInput label='"Read full bio" link label' value={data.home.aboutCtaLabel} onChange={(v) => updateHome({ aboutCtaLabel: v })} />
        </div>
      </section>
    </div>
  );
}

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  ip: string | null;
  userAgent: string | null;
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function InboxEditor({
  sessionToken,
  messages,
  loading,
  error,
  onRefresh,
  onUpdate,
  onDelete,
}: {
  sessionToken: string;
  messages: ContactMessage[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onUpdate: (m: ContactMessage) => void;
  onDelete: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    messages[0]?.id ?? null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  // Keep a valid selection as the list changes (after delete or refresh).
  useEffect(() => {
    if (selectedId && messages.some((m) => m.id === selectedId)) return;
    setSelectedId(messages[0]?.id ?? null);
  }, [messages, selectedId]);

  const selected = messages.find((m) => m.id === selectedId) ?? null;

  const callMessageEndpoint = async (
    id: string,
    action: "read" | "delete",
    body: Record<string, unknown> = {},
  ): Promise<{ ok: boolean; data: { message?: ContactMessage; error?: string } }> => {
    const url = `${import.meta.env.BASE_URL}api/admin/messages/${encodeURIComponent(id)}/${action}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: sessionToken, ...body }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      message?: ContactMessage;
      error?: string;
    };
    return { ok: res.ok, data };
  };

  const handleToggleRead = async (m: ContactMessage) => {
    setBusyId(m.id);
    try {
      const next = !m.readAt;
      const { ok, data } = await callMessageEndpoint(m.id, "read", { read: next });
      if (ok && data.message) onUpdate(data.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (m: ContactMessage) => {
    if (!window.confirm(`Delete this message from ${m.name}? This cannot be undone.`)) {
      return;
    }
    setBusyId(m.id);
    try {
      const { ok } = await callMessageEndpoint(m.id, "delete");
      if (ok) onDelete(m.id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-[#F2EDE5]">Inbox</h2>
          <p className="text-[#8A8278] text-sm mt-1">
            Messages submitted through the contact form. Newest first.
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="border border-[#3A3530] text-[#8A8278] px-3 py-2 hover:border-[#C8A96E] hover:text-[#C8A96E] transition-colors text-xs uppercase tracking-widest disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>
      {error && (
        <div className="text-red-400 text-sm border border-red-900/40 bg-red-950/20 px-3 py-2">
          {error}
        </div>
      )}
      {!loading && messages.length === 0 && !error ? (
        <div className="text-[#8A8278] text-sm border border-dashed border-[#3A3530] p-8 text-center">
          No messages yet. Submissions to the contact form will appear here.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <ul className="border border-[#272421] divide-y divide-[#272421] max-h-[60vh] overflow-y-auto">
            {messages.map((m) => {
              const unread = !m.readAt;
              const active = m.id === selectedId;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(m.id)}
                    className={`w-full text-left px-3 py-3 flex flex-col gap-1 transition-colors ${
                      active ? "bg-[#1B1815]" : "hover:bg-[#161310]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm truncate ${unread ? "text-[#F2EDE5] font-medium" : "text-[#8A8278]"}`}
                      >
                        {m.name || "(no name)"}
                      </span>
                      {unread && (
                        <span className="text-[10px] uppercase tracking-widest bg-[#C8A96E] text-[#0A0908] px-1.5 py-0.5">
                          New
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#6A6058] truncate">{m.email}</div>
                    <div className="text-xs text-[#4A4540] truncate">
                      {m.message.slice(0, 70)}
                      {m.message.length > 70 ? "…" : ""}
                    </div>
                    <div className="text-[10px] text-[#4A4540] uppercase tracking-widest">
                      {formatDate(m.createdAt)}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border border-[#272421] p-4 md:p-6 min-h-[300px]">
            {selected ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[#F2EDE5] font-medium">{selected.name}</div>
                    <a
                      href={`mailto:${selected.email}`}
                      className="text-[#C8A96E] text-sm hover:underline break-all"
                    >
                      {selected.email}
                    </a>
                    <div className="text-xs text-[#8A8278] mt-1">
                      {formatDate(selected.createdAt)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`mailto:${encodeURIComponent(selected.email)}?subject=${encodeURIComponent("Re: your message")}`}
                      className="bg-[#C8A96E] text-[#0A0908] px-3 py-2 hover:bg-[#E2C99A] transition-colors text-xs uppercase tracking-widest font-medium"
                    >
                      Reply
                    </a>
                    <button
                      onClick={() => handleToggleRead(selected)}
                      disabled={busyId === selected.id}
                      className="border border-[#3A3530] text-[#8A8278] px-3 py-2 hover:border-[#C8A96E] hover:text-[#C8A96E] transition-colors text-xs uppercase tracking-widest disabled:opacity-50"
                    >
                      Mark {selected.readAt ? "Unread" : "Read"}
                    </button>
                    <button
                      onClick={() => handleDelete(selected)}
                      disabled={busyId === selected.id}
                      className="border border-red-900/60 text-red-400 px-3 py-2 hover:bg-red-950/30 transition-colors text-xs uppercase tracking-widest disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="border-t border-[#272421] pt-4">
                  <div className="text-[#8A8278] text-xs uppercase tracking-widest mb-2">
                    Message
                  </div>
                  <div className="text-[#E8E2D8] whitespace-pre-wrap break-words">
                    {selected.message}
                  </div>
                </div>
                {(selected.ip || selected.userAgent) && (
                  <div className="border-t border-[#272421] pt-3 text-[10px] text-[#4A4540] uppercase tracking-widest space-y-1">
                    {selected.ip && <div>IP: {selected.ip}</div>}
                    {selected.userAgent && (
                      <div className="break-all normal-case tracking-normal">
                        UA: {selected.userAgent}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[#8A8278] text-sm">Select a message to view it.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Asset library (central media store) ────────────────────────────────
type Asset = {
  id: string;
  url: string;
  filename: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
};

type AssetType = "all" | "image" | "gif" | "video";

function assetTypeOf(mime: string): "image" | "gif" | "video" | "other" {
  if (mime === "image/gif") return "gif";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "other";
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function resolveAssetUrl(url: string): string {
  if (!url) return url;
  if (/^(https?:|data:)/i.test(url)) return url;
  return import.meta.env.BASE_URL + url.replace(/^\/+/, "");
}

async function readAssetDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  if (file.type.startsWith("image/")) {
    return new Promise((resolve) => {
      const objUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const out = { width: img.naturalWidth, height: img.naturalHeight };
        URL.revokeObjectURL(objUrl);
        resolve(out);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        resolve(null);
      };
      img.src = objUrl;
    });
  }
  if (file.type.startsWith("video/")) {
    return new Promise((resolve) => {
      const objUrl = URL.createObjectURL(file);
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => {
        const out = { width: v.videoWidth, height: v.videoHeight };
        URL.revokeObjectURL(objUrl);
        resolve(out);
      };
      v.onerror = () => {
        URL.revokeObjectURL(objUrl);
        resolve(null);
      };
      v.src = objUrl;
    });
  }
  return null;
}

const MAX_ASSET_BYTES = 4 * 1024 * 1024;

async function uploadAssetFile(
  file: File,
  sessionToken: string,
): Promise<Asset> {
  if (!sessionToken) throw new Error("Session expired — log out and back in.");
  if (!/^image\//.test(file.type) && !/^video\//.test(file.type)) {
    throw new Error(`Unsupported file type: ${file.type || "unknown"}.`);
  }
  if (file.size > MAX_ASSET_BYTES) {
    throw new Error(
      `"${file.name}" is too large (max ${MAX_ASSET_BYTES / 1024 / 1024} MB).`,
    );
  }
  const dims = await readAssetDimensions(file);
  const fd = new FormData();
  fd.append("token", sessionToken);
  fd.append("filename", file.name);
  if (dims?.width != null) fd.append("width", String(dims.width));
  if (dims?.height != null) fd.append("height", String(dims.height));
  fd.append("file", file, file.name);
  const url = `${import.meta.env.BASE_URL}api/admin/assets/upload`;
  const res = await fetch(url, { method: "POST", body: fd });
  const body = (await res.json().catch(() => ({}))) as {
    asset?: Asset;
    error?: string;
  };
  if (!res.ok || !body.asset) {
    throw new Error(body.error ?? `Upload failed (${res.status}).`);
  }
  return body.asset;
}

type PickerOpts = { type?: AssetType };
type AssetPickerFn = (
  onPick: (url: string) => void,
  opts?: PickerOpts,
) => void;

// Upload a file via the central asset library and return its public URL.
// Used by every editor that takes an image / video so uploads always
// land in the library (and on object storage), not as a base64 string
// inlined into the JSON content blob.
type AssetUploadFn = (file: File) => Promise<string>;

const AssetPickerContext = createContext<AssetPickerFn | null>(null);
const AssetUploadContext = createContext<AssetUploadFn | null>(null);

function useAssetPicker(): AssetPickerFn | null {
  return useContext(AssetPickerContext);
}

function useAssetUpload(): AssetUploadFn | null {
  return useContext(AssetUploadContext);
}

function PickFromLibraryButton({
  onPick,
  type = "all",
  label = "From library",
  size = "md",
}: {
  onPick: (url: string) => void;
  type?: AssetType;
  label?: string;
  size?: "sm" | "md";
}) {
  const open = useAssetPicker();
  if (!open) return null;
  const cls =
    size === "sm"
      ? "text-xs border border-[#3A3530] text-[#8A8278] px-2 py-1 hover:border-[#C8A96E] hover:text-[#C8A96E] uppercase tracking-widest"
      : "text-sm border border-[#3A3530] text-[#8A8278] px-3 py-1.5 hover:border-[#C8A96E] hover:text-[#C8A96E] uppercase tracking-widest";
  return (
    <button type="button" onClick={() => open(onPick, { type })} className={cls}>
      ⌘ {label}
    </button>
  );
}

function AssetThumb({
  asset,
  className = "",
}: {
  asset: Asset;
  className?: string;
}) {
  const t = assetTypeOf(asset.mime);
  const url = resolveAssetUrl(asset.url);
  if (t === "video") {
    return (
      <video
        src={url}
        muted
        playsInline
        preload="metadata"
        className={"w-full h-full object-cover bg-[#0A0908] " + className}
      />
    );
  }
  return (
    <img
      src={url}
      alt={asset.filename}
      loading="lazy"
      className={"w-full h-full object-cover bg-[#0A0908] " + className}
    />
  );
}

function AssetPickerModal({
  open,
  assets,
  loading,
  error,
  search,
  setSearch,
  type,
  setType,
  onPick,
  onClose,
  onRefresh,
}: {
  open: boolean;
  assets: Asset[];
  loading: boolean;
  error: string;
  search: string;
  setSearch: (s: string) => void;
  type: AssetType;
  setType: (t: AssetType) => void;
  onPick: (asset: Asset) => void;
  onClose: () => void;
  onRefresh: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-4xl max-h-[85vh] flex flex-col bg-[#0F0D0B] border border-[#272421]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#272421]">
          <h2 className="font-serif text-xl text-[#F2EDE5]">
            Insert from library
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8A8278] hover:text-[#F2EDE5] text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[#272421]">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename…"
            className="flex-1 min-w-[180px] bg-transparent border border-[#3A3530] text-[#F2EDE5] px-3 py-1.5 text-sm focus:outline-none focus:border-[#C8A96E]"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AssetType)}
            className="bg-[#0F0D0B] border border-[#3A3530] text-[#F2EDE5] px-2 py-1.5 text-sm"
          >
            <option value="all">All types</option>
            <option value="image">Images</option>
            <option value="gif">GIFs</option>
            <option value="video">Videos</option>
          </select>
          <button
            type="button"
            onClick={onRefresh}
            className="border border-[#3A3530] text-[#8A8278] px-3 py-1.5 hover:border-[#C8A96E] hover:text-[#C8A96E] text-xs uppercase tracking-widest"
          >
            Refresh
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading && <p className="text-[#8A8278] text-sm">Loading…</p>}
          {error && (
            <p className="text-red-400 text-sm border border-red-900/40 bg-red-950/20 px-3 py-2 mb-3">
              {error}
            </p>
          )}
          {!loading && assets.length === 0 && !error && (
            <p className="text-[#8A8278] text-sm">
              No assets yet. Upload some in the Assets tab first.
            </p>
          )}
          <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
            {assets.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onPick(a)}
                className="group flex flex-col gap-1 text-left border border-[#272421] hover:border-[#C8A96E] transition-colors p-1"
              >
                <div className="aspect-square overflow-hidden">
                  <AssetThumb asset={a} />
                </div>
                <div
                  className="text-[10px] text-[#8A8278] truncate px-1"
                  title={a.filename}
                >
                  {a.filename}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetsEditor({
  assets,
  total,
  loading,
  error,
  search,
  setSearch,
  type,
  setType,
  onRefresh,
  onUploadFiles,
  onRename,
  onDelete,
  onReplace,
}: {
  sessionToken: string;
  assets: Asset[];
  total: number;
  loading: boolean;
  error: string;
  search: string;
  setSearch: (s: string) => void;
  type: AssetType;
  setType: (t: AssetType) => void;
  onRefresh: () => void;
  onUploadFiles: (files: File[]) => Promise<void>;
  onRename: (id: string, filename: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReplace: (id: string, file: File) => Promise<void>;
}) {
  const [drag, setDrag] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadErr, setUploadErr] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setUploadErr("");
    setUploadMsg(
      `Uploading ${files.length} file${files.length === 1 ? "" : "s"}…`,
    );
    try {
      await onUploadFiles(files);
      setUploadMsg(
        `Uploaded ${files.length} file${files.length === 1 ? "" : "s"}.`,
      );
      setTimeout(() => setUploadMsg(""), 2500);
    } catch (e) {
      setUploadErr(e instanceof Error ? e.message : "Upload failed.");
      setUploadMsg("");
    }
  };

  const onCopy = async (a: Asset) => {
    const url = resolveAssetUrl(a.url);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(a.id);
      setTimeout(() => setCopied((c) => (c === a.id ? null : c)), 1500);
    } catch {
      window.prompt("Copy this URL:", url);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-2xl text-[#F2EDE5]">Assets</h2>
          <p className="text-[#8A8278] text-sm mt-1">
            Central library for images, GIFs, and short videos. Use{" "}
            <em>Insert from library</em> in any editor to reuse them.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="border border-[#3A3530] text-[#8A8278] px-3 py-2 hover:border-[#C8A96E] hover:text-[#C8A96E] text-xs uppercase tracking-widest disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setDrag(false);
          const files = Array.from(e.dataTransfer.files ?? []);
          await handleFiles(files);
        }}
        className={`border-2 border-dashed rounded p-6 text-center transition-colors ${drag ? "border-[#C8A96E] bg-[#1A1714]" : "border-[#3A3530] hover:border-[#C8A96E]"}`}
      >
        <p className="text-[#8A8278] text-sm">
          Drop image / GIF / video files here, or
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 text-[#C8A96E] text-sm uppercase tracking-widest hover:underline"
        >
          browse to upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            await handleFiles(files);
          }}
        />
        <p className="text-[#4A4540] text-[11px] mt-2 uppercase tracking-widest">
          Max {MAX_ASSET_BYTES / 1024 / 1024} MB per file
        </p>
        {uploadMsg && <p className="text-[#C8A96E] text-xs mt-2">{uploadMsg}</p>}
        {uploadErr && <p className="text-red-400 text-xs mt-2">{uploadErr}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by filename…"
          className="flex-1 min-w-[180px] bg-transparent border border-[#3A3530] text-[#F2EDE5] px-3 py-1.5 text-sm focus:outline-none focus:border-[#C8A96E]"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AssetType)}
          className="bg-[#0F0D0B] border border-[#3A3530] text-[#F2EDE5] px-2 py-1.5 text-sm"
        >
          <option value="all">All types</option>
          <option value="image">Images</option>
          <option value="gif">GIFs</option>
          <option value="video">Videos</option>
        </select>
        <span className="text-[#4A4540] text-xs uppercase tracking-widest">
          {total} {total === 1 ? "item" : "items"}
        </span>
      </div>

      {error && (
        <div className="text-red-400 text-sm border border-red-900/40 bg-red-950/20 px-3 py-2">
          {error}
        </div>
      )}

      {!loading && assets.length === 0 && !error ? (
        <div className="text-[#8A8278] text-sm border border-dashed border-[#3A3530] p-8 text-center">
          No assets yet. Upload some above.
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
          {assets.map((a) => (
            <div
              key={a.id}
              className="border border-[#272421] bg-[#0A0908] flex flex-col"
            >
              <div className="aspect-square overflow-hidden">
                <AssetThumb asset={a} />
              </div>
              <div className="p-2 flex flex-col gap-1 text-xs">
                {renaming === a.id ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setBusyId(a.id);
                      try {
                        await onRename(a.id, renameValue);
                        setRenaming(null);
                      } finally {
                        setBusyId(null);
                      }
                    }}
                    className="flex flex-col gap-1"
                  >
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="bg-transparent border border-[#3A3530] text-[#F2EDE5] px-2 py-1 text-xs"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <button
                        type="submit"
                        disabled={busyId === a.id}
                        className="text-[10px] uppercase tracking-widest text-[#C8A96E] border border-[#C8A96E] px-2 py-1"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenaming(null)}
                        className="text-[10px] uppercase tracking-widest text-[#8A8278] border border-[#3A3530] px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <span
                    className="text-[#F2EDE5] truncate"
                    title={a.filename}
                  >
                    {a.filename}
                  </span>
                )}
                <span className="text-[#4A4540] text-[10px] uppercase tracking-widest">
                  {assetTypeOf(a.mime)} · {formatBytes(a.size)}
                  {a.width && a.height ? ` · ${a.width}×${a.height}` : ""}
                </span>
                <span className="text-[#4A4540] text-[10px]">
                  {formatDate(a.createdAt)}
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  <button
                    type="button"
                    onClick={() => onCopy(a)}
                    className="text-[10px] uppercase tracking-widest text-[#8A8278] border border-[#3A3530] px-2 py-1 hover:text-[#C8A96E] hover:border-[#C8A96E]"
                  >
                    {copied === a.id ? "Copied!" : "Copy URL"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRenaming(a.id);
                      setRenameValue(a.filename);
                    }}
                    className="text-[10px] uppercase tracking-widest text-[#8A8278] border border-[#3A3530] px-2 py-1 hover:text-[#C8A96E] hover:border-[#C8A96E]"
                  >
                    Rename
                  </button>
                  <label className="text-[10px] uppercase tracking-widest text-[#8A8278] border border-[#3A3530] px-2 py-1 hover:text-[#C8A96E] hover:border-[#C8A96E] cursor-pointer">
                    Replace
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (!f) return;
                        setBusyId(a.id);
                        try {
                          await onReplace(a.id, f);
                        } finally {
                          setBusyId(null);
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          `Delete "${a.filename}"? This can't be undone.`,
                        )
                      )
                        return;
                      setBusyId(a.id);
                      try {
                        await onDelete(a.id);
                      } finally {
                        setBusyId(null);
                      }
                    }}
                    className="text-[10px] uppercase tracking-widest text-red-400 border border-red-900/60 px-2 py-1 hover:bg-red-950/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [sessionPassword, setSessionPassword] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    keyof ContentData | "inbox" | "assets" | "tags"
  >("projects");
  const [data, setData] = useState<ContentData>(() => loadDraft());
  const [savedMsg, setSavedMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsTotal, setAssetsTotal] = useState(0);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState("");
  const [assetSearch, setAssetSearch] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("all");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerType, setPickerType] = useState<AssetType>("all");
  const pickerCallbackRef = useRef<((url: string) => void) | null>(null);

  const fetchMessages = async (token: string) => {
    if (!token) return;
    setMessagesLoading(true);
    setMessagesError("");
    try {
      const url = `${import.meta.env.BASE_URL}api/admin/messages`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await res.json().catch(() => ({}))) as {
        messages?: ContactMessage[];
        error?: string;
      };
      if (!res.ok) {
        setMessagesError(body.error ?? `Failed to load (${res.status})`);
        return;
      }
      setMessages(body.messages ?? []);
    } catch {
      setMessagesError("Network error — couldn't reach the server.");
    } finally {
      setMessagesLoading(false);
    }
  };

  // Refresh inbox whenever the session token is set/refreshed (login,
  // page reload with a stored token, or tab switch back into Inbox).
  useEffect(() => {
    if (sessionPassword) void fetchMessages(sessionPassword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionPassword]);

  const fetchAssets = async (
    token: string,
    opts?: { search?: string; type?: AssetType },
  ) => {
    if (!token) return;
    setAssetsLoading(true);
    setAssetsError("");
    try {
      const params = new URLSearchParams();
      const s = opts?.search ?? assetSearch;
      const t = opts?.type ?? assetType;
      if (s) params.set("search", s);
      if (t && t !== "all") params.set("type", t);
      params.set("limit", "200");
      const url = `${import.meta.env.BASE_URL}api/admin/assets?${params.toString()}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await res.json().catch(() => ({}))) as {
        assets?: Asset[];
        total?: number;
        error?: string;
      };
      if (!res.ok) {
        setAssetsError(body.error ?? `Failed to load (${res.status})`);
        return;
      }
      setAssets(body.assets ?? []);
      setAssetsTotal(body.total ?? body.assets?.length ?? 0);
    } catch {
      setAssetsError("Network error — couldn't reach the server.");
    } finally {
      setAssetsLoading(false);
    }
  };

  // Re-fetch assets whenever the search/type filter changes (debounced
  // via short timeout — user typing shouldn't fire one request per key).
  useEffect(() => {
    if (!sessionPassword) return;
    const handle = setTimeout(() => {
      void fetchAssets(sessionPassword, {
        search: assetSearch,
        type: assetType,
      });
    }, 200);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionPassword, assetSearch, assetType]);

  const handleAssetUpload = async (files: File[]) => {
    const errors: string[] = [];
    for (const file of files) {
      try {
        await uploadAssetFile(file, sessionPassword);
      } catch (e) {
        errors.push(e instanceof Error ? e.message : `Failed: ${file.name}`);
      }
    }
    await fetchAssets(sessionPassword);
    if (errors.length > 0) throw new Error(errors.join(" • "));
  };

  const handleAssetRename = async (id: string, filename: string) => {
    const url = `${import.meta.env.BASE_URL}api/admin/assets/${encodeURIComponent(id)}/rename`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: sessionPassword, filename }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      asset?: Asset;
      error?: string;
    };
    if (!res.ok || !body.asset) {
      throw new Error(body.error ?? "Rename failed");
    }
    setAssets((prev) => prev.map((a) => (a.id === id ? body.asset! : a)));
  };

  const handleAssetDelete = async (id: string) => {
    const url = `${import.meta.env.BASE_URL}api/admin/assets/${encodeURIComponent(id)}/delete`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: sessionPassword }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? "Delete failed");
    }
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setAssetsTotal((n) => Math.max(0, n - 1));
  };

  const handleAssetReplace = async (id: string, file: File) => {
    if (!/^image\//.test(file.type) && !/^video\//.test(file.type)) {
      throw new Error(`Unsupported file type: ${file.type || "unknown"}.`);
    }
    if (file.size > MAX_ASSET_BYTES) {
      throw new Error(
        `File too large (max ${MAX_ASSET_BYTES / 1024 / 1024} MB).`,
      );
    }
    const dims = await readAssetDimensions(file);
    const fd = new FormData();
    fd.append("token", sessionPassword);
    if (dims?.width != null) fd.append("width", String(dims.width));
    if (dims?.height != null) fd.append("height", String(dims.height));
    fd.append("file", file, file.name);
    const url = `${import.meta.env.BASE_URL}api/admin/assets/${encodeURIComponent(id)}/replace`;
    const res = await fetch(url, { method: "POST", body: fd });
    const body = (await res.json().catch(() => ({}))) as {
      asset?: Asset;
      error?: string;
    };
    if (!res.ok || !body.asset) {
      throw new Error(body.error ?? "Replace failed");
    }
    setAssets((prev) => prev.map((a) => (a.id === id ? body.asset! : a)));
  };

  // Provided to deeply-nested editors (SectionsEditor, project/studio
  // image rows) so a file picker anywhere can push bytes through the
  // central asset library and resolve to a public URL — never inlining
  // base64 data URLs into the JSON content blob.
  const handleLibraryUpload: AssetUploadFn = async (file) => {
    const asset = await uploadAssetFile(file, sessionPassword);
    // Refresh the Assets tab grid in the background so a freshly
    // uploaded file shows up there immediately if the user switches
    // tabs. Failure is non-fatal — the upload itself already succeeded.
    void fetchAssets(sessionPassword, {
      search: assetSearch,
      type: assetType,
    });
    return resolveAssetUrl(asset.url);
  };

  const openAssetPicker: AssetPickerFn = (onPick, opts) => {
    pickerCallbackRef.current = onPick;
    setPickerType(opts?.type ?? "all");
    setPickerSearch("");
    setPickerOpen(true);
    if (sessionPassword) {
      void fetchAssets(sessionPassword, { search: "", type: opts?.type ?? "all" });
    }
  };

  const unreadCount = messages.reduce((n, m) => (m.readAt ? n : n + 1), 0);

  // Restore an existing signed token from localStorage on mount. We
  // persist a server-issued bearer token (HMAC-signed, 30-day expiry)
  // rather than the raw password — survives iframe reloads without
  // ever putting the literal password in storage.
  useEffect(() => {
    const stored = safeStorage.getItem(TOKEN_KEY);
    if (stored) {
      setSessionPassword(stored);
      setIsAuthenticated(true);
    }
    // Clean up legacy keys from older builds.
    safeSession.removeItem("lenna_admin_pw");
    safeStorage.removeItem("lenna_admin_pw");
    safeStorage.removeItem(AUTH_KEY);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const url = `${import.meta.env.BASE_URL}api/admin/login`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        token?: string;
        error?: string;
      };
      if (!res.ok || !body.token) {
        setError(body.error ?? "Incorrect password");
        return;
      }
      safeStorage.setItem(TOKEN_KEY, body.token);
      setSessionPassword(body.token);
      setIsAuthenticated(true);
      setPassword("");
    } catch {
      setError("Couldn't reach the server. Try again.");
    }
  };

  const handleLogout = () => {
    safeStorage.removeItem(TOKEN_KEY);
    safeStorage.removeItem(AUTH_KEY);
    safeStorage.removeItem("lenna_admin_pw");
    safeSession.removeItem("lenna_admin_pw");
    setIsAuthenticated(false);
    setSessionPassword("");
  };

  const handleSaveDraft = () => {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSavedMsg("Draft saved locally");
    setTimeout(() => setSavedMsg(""), 2500);
  };

  const handleSaveToSite = async () => {
    // Guard: gallery slugs power /studio/:slug — duplicates make routes
    // ambiguous, so refuse to save until they are resolved.
    const slugs = (data.gallery ?? []).map((g) => g.slug ?? "");
    const dupes = slugs.filter(
      (s, i) => s && slugs.indexOf(s) !== i,
    );
    if (dupes.length > 0) {
      setSavedMsg(
        `Error: duplicate gallery slug(s): ${[...new Set(dupes)].join(", ")} — fix before saving.`,
      );
      setTimeout(() => setSavedMsg(""), 5000);
      return;
    }
    const empty = (data.gallery ?? []).filter((g) => !g.slug);
    if (empty.length > 0) {
      setSavedMsg(
        `Error: ${empty.length} gallery item(s) have no slug — fix before saving.`,
      );
      setTimeout(() => setSavedMsg(""), 5000);
      return;
    }
    if (!data.identity?.name?.trim()) {
      setSavedMsg("Error: Identity name cannot be empty.");
      setTimeout(() => setSavedMsg(""), 5000);
      return;
    }
    const badSocials = (data.contact?.socials ?? []).filter((s) => {
      const href = (s.href ?? "").trim();
      if (!href) return false;
      try {
        const u = new URL(href);
        return !["http:", "https:", "mailto:", "tel:"].includes(u.protocol);
      } catch {
        return true;
      }
    });
    if (badSocials.length > 0) {
      setSavedMsg(
        `Error: invalid social URL(s): ${badSocials.map((s) => s.label || s.href).join(", ")}`,
      );
      setTimeout(() => setSavedMsg(""), 5000);
      return;
    }
    if (!sessionPassword) {
      // Token missing (cleared storage / expired). Force a clean re-login.
      handleLogout();
      setSavedMsg("Session expired — please log in again.");
      setTimeout(() => setSavedMsg(""), 4000);
      return;
    }
    setIsSaving(true);
    setSavedMsg("");
    try {
      const url = `${import.meta.env.BASE_URL}api/admin/content`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: sessionPassword, data }),
      });
      if (res.ok) {
        safeStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setSavedMsg("Saved to site! Reload to see changes.");
        setTimeout(() => setSavedMsg(""), 4000);
      } else {
        const body = await res.json().catch(() => ({})) as { error?: string };
        // 401 means our stored password is stale or wrong — drop the
        // session so the next attempt forces a fresh login instead of
        // looping forever.
        if (res.status === 401) {
          handleLogout();
          setSavedMsg("Unauthorized — please log in again.");
        } else {
          setSavedMsg(`Error: ${body.error ?? res.statusText}`);
        }
        setTimeout(() => setSavedMsg(""), 4000);
      }
    } catch {
      setSavedMsg("Network error — check the API server is running.");
      setTimeout(() => setSavedMsg(""), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = (tab?: keyof ContentData) => {
    let content: unknown = tab ? data[tab] : data;
    let filename = tab ? `${tab}.json` : "lenna_portfolio_data.json";
    if (tab === "identity") {
      content = { identity: data.identity, contact: data.contact };
      filename = "identity_contact.json";
    }
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateSection = <K extends keyof ContentData>(key: K, value: ContentData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-[#141210] p-12 border border-[#272421] w-full max-w-md flex flex-col gap-8">
          <h1 className="font-serif text-3xl text-[#F2EDE5]">Admin Access</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[#8A8278] text-sm uppercase tracking-widest">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-b border-[#3A3530] text-[#F2EDE5] py-2 focus:outline-none focus:border-[#C8A96E] transition-colors"
                autoFocus
              />
              {error && <span className="text-[#C8A96E] text-sm mt-1">{error}</span>}
            </div>
            <button
              type="submit"
              className="bg-[#C8A96E] text-[#0A0908] py-3 px-6 uppercase tracking-widest hover:bg-[#E2C99A] transition-colors font-medium"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  const tabs: (keyof ContentData | "inbox" | "assets" | "tags")[] = [
    "projects",
    "about",
    "experience",
    "education",
    "gallery",
    "tags",
    "identity",
    "files",
    "homepage",
    "assets",
    "inbox",
  ];

  const tabLabel = (
    tab: keyof ContentData | "inbox" | "assets" | "tags",
  ): string => {
    if (tab === "identity") return "Identity & Contact";
    if (tab === "files") return "Files";
    if (tab === "homepage") return "Home & Entry";
    if (tab === "inbox") return "Inbox";
    if (tab === "assets") return "Assets";
    if (tab === "tags") return "Tags";
    return tab;
  };

  const allTagSuggestions = Array.from(
    deriveTagStats(data.projects, data.gallery).keys(),
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="w-full flex flex-col gap-8 pt-12 pb-24">
      <div className="flex flex-wrap justify-between items-start border-b border-[#272421] pb-6 gap-4">
        <div>
          <h1 className="font-serif text-4xl text-[#F2EDE5]">Content Manager</h1>
          <p className="text-[#8A8278] text-sm mt-1">
            Edit content below, then click Save to Site to update the live files instantly.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          {savedMsg && (
            <span className={`text-sm ${savedMsg.startsWith("Error") || savedMsg.startsWith("Network") ? "text-red-400" : "text-[#C8A96E]"}`}>
              {savedMsg}
            </span>
          )}
          <button
            onClick={handleSaveDraft}
            className="border border-[#3A3530] text-[#8A8278] px-4 py-2 hover:border-[#C8A96E] hover:text-[#C8A96E] transition-colors text-sm uppercase tracking-widest"
          >
            Save Draft
          </button>
          <button
            onClick={handleSaveToSite}
            disabled={isSaving}
            className="bg-[#C8A96E] text-[#0A0908] px-4 py-2 hover:bg-[#E2C99A] transition-colors text-sm uppercase tracking-widest font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving…" : "Save to Site"}
          </button>
          <button
            onClick={() =>
              handleExport(
                activeTab === "inbox" || activeTab === "assets" || activeTab === "tags"
                  ? undefined
                  : activeTab,
              )
            }
            className="border border-[#272421] text-[#4A4540] px-4 py-2 hover:border-[#3A3530] hover:text-[#8A8278] transition-colors text-sm uppercase tracking-widest"
          >
            Export JSON
          </button>
          <button
            onClick={handleLogout}
            className="border border-[#272421] text-[#4A4540] px-4 py-2 hover:border-[#3A3530] hover:text-[#8A8278] transition-colors text-sm uppercase tracking-widest"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[#272421] pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 uppercase tracking-widest text-sm transition-colors capitalize whitespace-nowrap inline-flex items-center gap-2 ${
              activeTab === tab
                ? "text-[#C8A96E] border-b-2 border-[#C8A96E]"
                : "text-[#8A8278] hover:text-[#F2EDE5]"
            }`}
          >
            {tabLabel(tab)}
            {tab === "inbox" && unreadCount > 0 && (
              <span className="text-[10px] font-semibold bg-[#C8A96E] text-[#0A0908] rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <AssetPickerContext.Provider value={openAssetPicker}>
      <AssetUploadContext.Provider value={handleLibraryUpload}>
      <AssetPickerModal
        open={pickerOpen}
        assets={assets}
        loading={assetsLoading}
        error={assetsError}
        search={pickerSearch}
        setSearch={(s) => {
          setPickerSearch(s);
          if (sessionPassword) {
            void fetchAssets(sessionPassword, { search: s, type: pickerType });
          }
        }}
        type={pickerType}
        setType={(t) => {
          setPickerType(t);
          if (sessionPassword) {
            void fetchAssets(sessionPassword, {
              search: pickerSearch,
              type: t,
            });
          }
        }}
        onPick={(a) => {
          const cb = pickerCallbackRef.current;
          pickerCallbackRef.current = null;
          setPickerOpen(false);
          if (cb) cb(resolveAssetUrl(a.url));
        }}
        onClose={() => {
          pickerCallbackRef.current = null;
          setPickerOpen(false);
        }}
        onRefresh={() => {
          if (sessionPassword) {
            void fetchAssets(sessionPassword, {
              search: pickerSearch,
              type: pickerType,
            });
          }
        }}
      />
      <div className="bg-[#141210] border border-[#272421] p-6 md:p-8 min-h-[500px]">
        {activeTab === "projects" && (
          <ProjectsEditor
            data={data.projects}
            onChange={(d) => updateSection("projects", d)}
            tagSuggestions={allTagSuggestions}
          />
        )}
        {activeTab === "tags" && (
          <TagsManager
            projects={data.projects}
            gallery={data.gallery}
            onProjectsChange={(p) => updateSection("projects", p)}
            onGalleryChange={(g) => updateSection("gallery", g)}
          />
        )}
        {activeTab === "about" && (
          <AboutEditor data={data.about} onChange={(d) => updateSection("about", d)} />
        )}
        {activeTab === "experience" && (
          <ExperienceEditor
            data={data.experience}
            onChange={(d) => updateSection("experience", d)}
          />
        )}
        {activeTab === "education" && (
          <EducationEditor
            data={data.education}
            onChange={(d) => updateSection("education", d)}
          />
        )}
        {activeTab === "gallery" && (
          <GalleryEditor
            data={data.gallery}
            onChange={(d) => updateSection("gallery", d)}
            tagSuggestions={allTagSuggestions}
          />
        )}
        {activeTab === "identity" && (
          <IdentityContactEditor
            identity={data.identity}
            contact={data.contact}
            onIdentityChange={(d) => updateSection("identity", d)}
            onContactChange={(d) => updateSection("contact", d)}
          />
        )}
        {activeTab === "files" && (
          <FilesEditor
            data={data.files}
            onChange={(d) => updateSection("files", d)}
            sessionToken={sessionPassword}
          />
        )}
        {activeTab === "homepage" && (
          <HomepageEditor
            data={data.homepage}
            onChange={(d) => updateSection("homepage", d)}
          />
        )}
        {activeTab === "assets" && (
          <AssetsEditor
            sessionToken={sessionPassword}
            assets={assets}
            total={assetsTotal}
            loading={assetsLoading}
            error={assetsError}
            search={assetSearch}
            setSearch={setAssetSearch}
            type={assetType}
            setType={setAssetType}
            onRefresh={() =>
              void fetchAssets(sessionPassword, {
                search: assetSearch,
                type: assetType,
              })
            }
            onUploadFiles={handleAssetUpload}
            onRename={handleAssetRename}
            onDelete={handleAssetDelete}
            onReplace={handleAssetReplace}
          />
        )}
        {activeTab === "inbox" && (
          <InboxEditor
            sessionToken={sessionPassword}
            messages={messages}
            loading={messagesLoading}
            error={messagesError}
            onRefresh={() => void fetchMessages(sessionPassword)}
            onUpdate={(m) =>
              setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)))
            }
            onDelete={(id) =>
              setMessages((prev) => prev.filter((x) => x.id !== id))
            }
          />
        )}
      </div>
      </AssetUploadContext.Provider>
      </AssetPickerContext.Provider>

      <div className="border border-[#272421] p-4 text-[#4A4540] text-sm">
        <strong className="text-[#8A8278]">Workflow:</strong> Edit content above
        {" → "}<span className="text-[#C8A96E]">Save to Site</span> (writes directly to <code className="text-[#C8A96E]">src/data/</code> and hot-reloads)
        {" — or — "}Save Draft (browser only)
        {" → "}Export JSON (manual backup).
      </div>
    </div>
  );
}
