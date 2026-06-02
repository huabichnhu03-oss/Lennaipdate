/**
 * About section editor — bio paragraphs and skills (JSON).
 */
import type { About, SkillGroup } from "./types";

export function AboutEditor({
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
