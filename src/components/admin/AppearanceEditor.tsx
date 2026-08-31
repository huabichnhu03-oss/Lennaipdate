/**
 * Site-wide typefaces. Changing these restyles every public page after Save to Site.
 */
import type { Appearance, AppearancePreset } from "./types";
import { TextInput } from "./shared";
import {
  FONT_PRESETS,
  appearanceFromPreset,
  rebuildCustomFamilies,
} from "@/lib/fonts";

export function AppearanceEditor({
  data,
  onChange,
}: {
  data: Appearance;
  onChange: (next: Appearance) => void;
}) {
  const applyPreset = (id: AppearancePreset) => {
    if (id === "custom") {
      onChange({ ...data, preset: "custom" });
      return;
    }
    onChange(appearanceFromPreset(id));
  };

  const setCustomField = (
    key: "displayFont" | "sansFont" | "serifFont",
    value: string,
  ) => {
    const next = { ...data, preset: "custom" as const, [key]: value };
    onChange({
      ...next,
      googleFamilies: rebuildCustomFamilies(
        next.displayFont,
        next.sansFont,
        next.serifFont,
      ),
    });
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <h2 className="font-serif text-2xl text-[#F2EDE5]">Fonts & look</h2>
        <p className="text-[#8A8278] text-sm mt-1">
          These three families drive the whole portfolio: headlines (`font-display`),
          body (`font-sans`), and serif accents (`font-serif`). Pick a preset, or
          type any Google Fonts family names and Save to Site.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <label className="text-[#8A8278] text-xs uppercase tracking-widest">Presets</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FONT_PRESETS.map((preset) => {
            const active = data.preset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`text-left border px-4 py-3 transition-colors ${
                  active
                    ? "border-[#C8A96E] bg-[#C8A96E]/10"
                    : "border-[#272421] hover:border-[#C8A96E]"
                }`}
              >
                <span className="block text-[#F2EDE5] text-sm">{preset.label}</span>
                <span className="block text-[#8A8278] text-xs mt-1 leading-relaxed">
                  {preset.note}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4 border border-[#272421] p-4">
        <h3 className="text-[#C8A96E] text-sm uppercase tracking-widest">Typefaces</h3>
        <TextInput
          label="Display / headlines"
          value={data.displayFont}
          onChange={(v) => setCustomField("displayFont", v)}
          hint="Big titles: Studio, Work, case-study names. Use the exact Google Fonts name."
        />
        <TextInput
          label="Sans / body"
          value={data.sansFont}
          onChange={(v) => setCustomField("sansFont", v)}
          hint="Paragraphs, nav, buttons, captions."
        />
        <TextInput
          label="Serif / accents"
          value={data.serifFont}
          onChange={(v) => setCustomField("serifFont", v)}
          hint="Folder titles, quotes, admin headings."
        />
        <p className="text-[#4A4540] text-[11px] font-sans leading-relaxed">
          Live preview of the current trio:
        </p>
        <div className="border border-[#3A3530] p-4 flex flex-col gap-2 bg-[#0A0908]">
          <p className="font-display font-black uppercase text-3xl text-[#F2EDE5]">
            Display sample
          </p>
          <p className="font-sans text-[#F2EDE5]">
            Body sample — the quick brown fox jumps over the lazy dog.
          </p>
          <p className="font-serif italic text-xl text-[#C8A96E]">Serif sample — Lenna</p>
        </div>
      </section>
    </div>
  );
}
