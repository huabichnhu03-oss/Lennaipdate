/**
 * About section editor — portrait, bio paragraphs, and skills (JSON).
 */
import type { About, SkillGroup } from "./types";
import { TextInput } from "./shared";
import {
  UploadToLibraryDashed,
  PickFromLibraryButton,
} from "./AssetLibrary";
import { SafeImage } from "@/components/SafeImage";

export function AboutEditor({
  data,
  onChange,
  onPreviewHome,
  onPreviewAbout,
}: {
  data: About;
  onChange: (d: About) => void;
  onPreviewHome?: (about: About) => void;
  onPreviewAbout?: (about: About) => void;
}) {
  const photo = data.photo ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 max-w-md">
        <label className="text-[#8A8278] text-xs uppercase tracking-widest">
          About portrait
        </label>
        <input
          type="text"
          value={photo}
          onChange={(e) => onChange({ ...data, photo: e.target.value })}
          placeholder="Paste image URL or upload below"
          className="bg-transparent border-b border-[#3A3530] text-[#F2EDE5] py-2 text-sm focus:outline-none focus:border-[#C8A96E] transition-colors"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <UploadToLibraryDashed
            label="↑ Upload portrait"
            accept="image/*,.jpg,.jpeg,.png,.webp,.gif"
            onUploaded={(url) => onChange({ ...data, photo: url })}
          />
          <PickFromLibraryButton
            onPick={(url) => onChange({ ...data, photo: url })}
          />
          {photo && (
            <button
              type="button"
              onClick={() => onChange({ ...data, photo: "" })}
              className="text-sm text-[#4A4540] hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        {photo ? (
          <div
            className="rounded overflow-hidden border border-[#3A3530] mt-1"
            style={{ maxWidth: "220px", aspectRatio: "3 / 4" }}
          >
            <SafeImage
              src={photo}
              alt="About portrait preview"
              className="w-full h-full object-cover"
              fallbackAspect="3 / 4"
            />
          </div>
        ) : (
          <p className="text-[#4A4540] text-xs">
            No portrait set — the About page will show a placeholder until you upload one.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 max-w-md">
        <TextInput
          label="Years of experience"
          value={data.yearsExperience ?? "3+"}
          onChange={(v) => onChange({ ...data, yearsExperience: v })}
        />
        <p className="text-[#4A4540] text-xs">
          Shown on Home and About (e.g. 3+, 4+). Use Preview to check before publishing, or Save to Site to go live.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {onPreviewHome && (
            <button
              type="button"
              onClick={() => onPreviewHome(data)}
              className="text-sm border border-[#C8A96E] text-[#C8A96E] px-3 py-2 hover:bg-[#C8A96E] hover:text-[#0A0908] transition-colors uppercase tracking-widest"
            >
              Preview Home
            </button>
          )}
          {onPreviewAbout && (
            <button
              type="button"
              onClick={() => onPreviewAbout(data)}
              className="text-sm border border-[#C8A96E] text-[#C8A96E] px-3 py-2 hover:bg-[#C8A96E] hover:text-[#0A0908] transition-colors uppercase tracking-widest"
            >
              Preview About
            </button>
          )}
        </div>
      </div>

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
