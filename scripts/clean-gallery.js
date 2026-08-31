/**
 * clean-gallery.js
 *
 * Reads src/data/gallery.json and produces a cleaned version that replaces
 * inline base64 data-URL images with placeholder URLs. The original file
 * is backed up to gallery.json.bak before overwriting.
 *
 * Usage:
 *   node scripts/clean-gallery.js
 *
 * What it does:
 *   1. Reads gallery.json
 *   2. For every `coverImage` or `images[]` entry that starts with "data:",
 *      replaces it with a placeholder URL like "/api/assets/<item-slug>-<field>"
 *   3. Writes the cleaned JSON back to gallery.json
 *   4. Reports how many inline entries were replaced
 *
 * The placeholder URLs match the pattern the admin panel's migration tool
 * would produce, so the site will show broken images until real assets
 * are uploaded through the admin panel.
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const galleryPath = join(__dirname, "..", "src", "data", "gallery.json");
const backupPath = galleryPath + ".bak";

if (!existsSync(galleryPath)) {
  console.error("Error: gallery.json not found at", galleryPath);
  process.exit(1);
}

console.log("Reading gallery.json …");
const raw = readFileSync(galleryPath, "utf-8");
const items = JSON.parse(raw);

if (!Array.isArray(items)) {
  console.error("Error: gallery.json is not an array");
  process.exit(1);
}

let replaced = 0;

for (const item of items) {
  const label = item.title?.trim() || item.slug?.trim() || item.id || "unknown";

  // Clean coverImage
  if (typeof item.coverImage === "string" && item.coverImage.startsWith("data:")) {
    const placeholder = `/api/assets/${item.slug || item.id || "item"}-cover`;
    console.log(`  [coverImage] ${label}: base64 → ${placeholder}`);
    item.coverImage = placeholder;
    replaced++;
  }

  // Clean images array (legacy URL strings or { src, columns } objects)
  if (Array.isArray(item.images)) {
    for (let i = 0; i < item.images.length; i++) {
      const entry = item.images[i];
      const src = typeof entry === "string" ? entry : entry?.src;
      if (typeof src === "string" && src.startsWith("data:")) {
        const placeholder = `/api/assets/${item.slug || item.id || "item"}-image-${i + 1}`;
        console.log(`  [images[${i}]] ${label}: base64 → ${placeholder}`);
        if (typeof entry === "string") {
          item.images[i] = placeholder;
        } else {
          item.images[i] = { ...entry, src: placeholder };
        }
        replaced++;
      }
    }
  }
}

if (replaced === 0) {
  console.log("No inline base64 data found. Gallery is already clean.");
  process.exit(0);
}

// Backup original
console.log(`Backing up original to ${backupPath}`);
copyFileSync(galleryPath, backupPath);

// Write cleaned version
const cleaned = JSON.stringify(items, null, 2) + "\n";
writeFileSync(galleryPath, cleaned, "utf-8");

console.log(`\nDone. Replaced ${replaced} inline base64 entry/entries.`);
console.log(`Cleaned file: ${galleryPath}`);
console.log(`Backup:       ${backupPath}`);
console.log(`\nNote: The placeholder URLs point to the asset API.`);
console.log(`Upload real images through the admin panel's Assets tab to fix them.`);
