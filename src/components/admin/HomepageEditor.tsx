/**
 * Homepage editor — entry/splash page and home page content.
 */
import type { Homepage } from "./types";
import { TextInput, TextareaInput } from "./shared";

export function HomepageEditor({
  data,
  onChange,
}: {
  data: Homepage;
  onChange: (next: Homepage) => void;
}) {
  const updateEntry = (patch: Partial<Homepage["entry"]>) =>
    onChange({ ...data, entry: { ...data.entry, ...patch } });
  const updateDesignCard = (patch: Partial<Homepage["entry"]["designCard"]>) =>
    updateEntry({ designCard: { ...data.entry.designCard, ...patch } });
  const updateArtCard = (patch: Partial<Homepage["entry"]["artCard"]>) =>
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
