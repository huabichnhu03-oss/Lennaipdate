import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projects = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/projects.json"), "utf8"),
);
const h = projects.find((x) => x.slug === "habiganize");
if (!h) throw new Error("habiganize missing from src/data/projects.json");

const always = h.sections.filter((s) => s.visibility !== "detail");
const detail = h.sections.filter((s) => s.visibility === "detail");

const exportObj = {
  _readme: {
    purpose:
      "Upload this file in portfolio Admin → Work → select Habiganize → Upload JSON / TXT, then Save to sync Neon.",
    seeMore:
      'Sections with visibility "detail" stay hidden until the visitor clicks "See more detail". Sections with visibility "always" are the default ~5 min skim.',
    skimCount: always.length,
    detailOnlyCount: detail.length,
    totalSections: h.sections.length,
    skimTitles: always.map((s) => s.title || s.id),
    detailOnlyTitles: detail.map((s) => s.title || s.id),
    important:
      "Keep every section's visibility field. Admin import merges legacy detailSections if present, but this file uses the modern single sections[] + visibility format.",
    assets:
      "Image/video paths are /case-studies/habiganize/... — those files must already be on the site (public/ on deploy).",
    liveProduct: "https://habitganizer.tech",
    localPreview: "http://localhost:5174/work/habiganize",
  },
  id: h.id,
  slug: h.slug,
  title: h.title,
  subtitle: h.subtitle,
  ...(h.cardDescription ? { cardDescription: h.cardDescription } : {}),
  type: h.type,
  users: h.users,
  methods: h.methods,
  period: h.period,
  tags: h.tags,
  description: h.description,
  bullets: h.bullets,
  challenge: h.challenge,
  solution: h.solution,
  impact: h.impact,
  coverImage: h.coverImage,
  year: h.year,
  featured: h.featured,
  archived: h.archived ?? false,
  sections: h.sections,
};

const outDir = path.join(root, "exports");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "habiganize-case-study-upload.json");
fs.writeFileSync(outPath, `${JSON.stringify(exportObj, null, 2)}\n`);

const md = `# Habiganize — Admin upload package

## File

[\`habiganize-case-study-upload.json\`](./habiganize-case-study-upload.json)

## How to upload

1. Open portfolio Admin (e.g. \`https://lennahua.ca/admin\` or local \`/admin\`).
2. Go to **Work** → select project **Habiganize** (slug \`habiganize\`).
3. Click **Upload JSON / TXT** and choose \`habiganize-case-study-upload.json\`.
4. Confirm details + sections look right (see visibility below).
5. **Save** so Neon DB updates.

> The \`_readme\` key at the top of the JSON is documentation only. Admin import ignores unknown fields — if anything looks odd, you can delete \`_readme\` before upload; it is safe either way.

## See more detail (important)

This case study is **two-tier** inside one \`sections\` array:

| \`visibility\` | Meaning | Count |
|---|---|---|
| \`"always"\` | Shown in the default ~5 min skim | **${always.length}** |
| \`"detail"\` | Shown only after **See more detail** | **${detail.length}** |

### Skim (always)

${always.map((s, i) => `${i + 1}. ${s.title || s.id}`).join("\n")}

### Extra after See more (detail)

${detail.map((s, i) => `${i + 1}. ${s.title || s.id}`).join("\n")}

Do **not** remove \`visibility\` from sections when editing — without it, everything shows at once and the See more button may hide.

## Assets (must already be on the site)

Paths in this JSON are relative (e.g. \`/case-studies/habiganize/promo.webm\`).  
They live in \`public/case-studies/habiganize/\` in the Lennaipdate repo. Deploy the portfolio (or confirm those files are live) before/after uploading content, or images/video will 404.

## Regenerating this export

\`\`\`bash
node scripts/export-habiganize-upload.mjs
\`\`\`
`;

fs.writeFileSync(path.join(outDir, "README-habiganize-upload.md"), md);
console.log("Wrote", outPath);
console.log("skim", always.length, "detail", detail.length, "total", h.sections.length);
