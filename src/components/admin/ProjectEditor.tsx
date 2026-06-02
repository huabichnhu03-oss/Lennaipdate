/**
 * ProjectEditor — edit project details, sections, cover images, tags, etc.
 * Includes SectionsEditor for managing text/image/problem-solution blocks.
 */
import { useEffect, useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { AdminSortableList } from "@/pages/admin-sortable";
import type { Project, Section, SectionType } from "./types";
import {
  TextInput,
  TextareaInput,
  CheckboxInput,
  TagsInput,
} from "./shared";
import {
  SectionImageUploader,
  UploadToLibraryDashed,
  PickFromLibraryButton,
} from "./AssetLibrary";

// ── Helpers ────────────────────────────────────────────────────────────

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
        archived: parsed.archived ?? false,
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

// ── SectionsEditor ─────────────────────────────────────────────────────

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

// ── ProjectsEditor ─────────────────────────────────────────────────────

export function ProjectsEditor({
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
  const [visibilityFilter, setVisibilityFilter] = useState<
    "all" | "active" | "archived"
  >("all");

  const selectedProjectId = data[selectedIdx]?.id;
  const projectCounts = {
    all: data.length,
    active: data.filter((p) => !p.archived).length,
    archived: data.filter((p) => Boolean(p.archived)).length,
  };
  const visibleProjects = data.filter((p) => {
    if (visibilityFilter === "active") return !p.archived;
    if (visibilityFilter === "archived") return Boolean(p.archived);
    return true;
  });

  useEffect(() => {
    if (data.length === 0) return;
    if (!selectedProjectId) {
      setSelectedIdx(0);
      return;
    }
    const selectedStillVisible = visibleProjects.some((p) => p.id === selectedProjectId);
    if (selectedStillVisible) return;
    const fallback = visibleProjects[0];
    if (!fallback) return;
    const fallbackIdx = data.findIndex((p) => p.id === fallback.id);
    if (fallbackIdx !== -1) setSelectedIdx(fallbackIdx);
  }, [data, visibleProjects, selectedProjectId]);

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
      archived: false,
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
        <div className="mb-2 flex flex-col gap-1">
          {(
            [
              { id: "all" as const, label: "All", count: projectCounts.all },
              { id: "active" as const, label: "Active", count: projectCounts.active },
              { id: "archived" as const, label: "Archived", count: projectCounts.archived },
            ]
          ).map((opt) => {
            const active = visibilityFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setVisibilityFilter(opt.id)}
                className={`flex items-center justify-between gap-2 text-[10px] uppercase tracking-widest px-2 py-1.5 border transition-colors ${
                  active
                    ? "bg-[#C8A96E] text-[#0A0908] border-[#C8A96E]"
                    : "text-[#8A8278] border-[#3A3530] hover:border-[#C8A96E]"
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`tabular-nums text-[9px] px-1.5 py-0.5 rounded ${
                    active ? "bg-[#0A0908]/20" : "bg-[#1B1815] text-[#4A4540]"
                  }`}
                >
                  {opt.count}
                </span>
              </button>
            );
          })}
        </div>
        <AdminSortableList
          items={visibleProjects}
          onReorder={(newArr) => {
            const selectedId = data[selectedIdx]?.id;
            let reorderedFull = newArr;
            if (visibilityFilter === "all") {
              onChange(newArr);
            } else {
              const next = [...data];
              const positions = data.reduce<number[]>((acc, item, i) => {
                const matches =
                  visibilityFilter === "active"
                    ? !item.archived
                    : Boolean(item.archived);
                if (matches) acc.push(i);
                return acc;
              }, []);
              positions.forEach((pos, i) => {
                next[pos] = newArr[i]!;
              });
              reorderedFull = next;
              onChange(next);
            }
            if (selectedId) {
              const newIdx = reorderedFull.findIndex((p) => p.id === selectedId);
              if (newIdx !== -1) setSelectedIdx(newIdx);
            }
          }}
          renderItem={(p, i, dragHandle) => (
            <div className="flex items-center gap-1">
              {dragHandle}
              <button
                onClick={() => {
                  const realIdx = data.findIndex((x) => x.id === p.id);
                  if (realIdx !== -1) setSelectedIdx(realIdx);
                  setSubTab("details");
                }}
                className={`flex-1 text-left text-sm px-2 py-2 truncate transition-colors ${
                  p.id === selectedProjectId
                    ? "bg-[#C8A96E] text-[#0A0908]"
                    : "text-[#8A8278] hover:text-[#F2EDE5] border border-[#272421] hover:border-[#3A3530]"
                }`}
              >
                {p.title}
                {p.archived && (
                  <span className="ml-2 text-[10px] uppercase tracking-widest opacity-70">
                    (archived)
                  </span>
                )}
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
              <TextInput label="Card Description (short preview)" value={(project as any).cardDescription || ""} onChange={(v) => updateProject(selectedIdx, { cardDescription: v })} />
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
              <CheckboxInput
                label="Archive (hide from public site)"
                checked={Boolean(project.archived)}
                onChange={(v) => updateProject(selectedIdx, { archived: v })}
              />
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
