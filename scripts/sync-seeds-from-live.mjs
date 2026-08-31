#!/usr/bin/env node
/**
 * Pull published content from lennahua.ca into lib/data + src/data seeds.
 * Run before deploy so bundled fallbacks match production (no flash / drift).
 *
 *   node scripts/sync-seeds-from-live.mjs
 *   LIVE_URL=https://www.lennahua.ca/api/content?meta=1 node scripts/sync-seeds-from-live.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const LIVE_URL =
  process.env.LIVE_URL ?? "https://www.lennahua.ca/api/content?meta=1";

/** Sections stored in production Postgres today (do not include studio/appearance). */
const LIVE_SECTIONS = [
  "projects",
  "about",
  "experience",
  "education",
  "gallery",
  "identity",
  "contact",
  "files",
  "homepage",
];

async function main() {
  console.log(`Fetching ${LIVE_URL} …`);
  const res = await fetch(LIVE_URL);
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }
  const payload = await res.json();
  const data = payload.data ?? payload;
  if (!data || typeof data !== "object") {
    throw new Error("Unexpected API response — expected { data: { … } }");
  }

  for (const section of LIVE_SECTIONS) {
    const value = data[section];
    if (value === undefined || value === null) {
      console.warn(`  skip ${section} — not in live payload`);
      continue;
    }
    const json = JSON.stringify(value, null, 2) + "\n";
    for (const dir of ["lib/data", "src/data"]) {
      const file = path.join(root, dir, `${section}.json`);
      fs.writeFileSync(file, json, "utf8");
    }
    const kb = (Buffer.byteLength(json) / 1024).toFixed(1);
    console.log(`  ✓ ${section} (${kb} KB) → lib/data + src/data`);
  }

  console.log("\nDone. studio.json + appearance.json left unchanged (feature seeds only).");
  console.log("Review git diff, then commit seeds with your code deploy.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
