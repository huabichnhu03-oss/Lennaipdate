/**
 * Shared UI primitives used across admin panel editor components.
 */
import { useState } from "react";
import type { AssetType } from "./types";

// ── Utility helpers ────────────────────────────────────────────────────

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function assetTypeOf(mime: string): "image" | "gif" | "video" | "other" {
  if (mime === "image/gif") return "gif";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "other";
}

export function resolveAssetUrl(url: string): string {
  if (!url) return url;
  if (/^(https?:|data:)/i.test(url)) return url;
  return import.meta.env.BASE_URL + url.replace(/^\/+/, "");
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export function extForMime(mime: string): string {
  const normalized = mime.toLowerCase();
  if (normalized === "image/jpeg") return "jpg";
  if (normalized === "image/png") return "png";
  if (normalized === "image/webp") return "webp";
  if (normalized === "image/gif") return "gif";
  if (normalized === "video/mp4") return "mp4";
  if (normalized === "video/webm") return "webm";
  if (normalized === "video/ogg") return "ogv";
  if (normalized === "video/quicktime") return "mov";
  const slash = normalized.indexOf("/");
  if (slash > -1 && slash < normalized.length - 1) {
    return normalized.slice(slash + 1).replace(/[^a-z0-9]+/g, "");
  }
  return "bin";
}

// ── Input components ───────────────────────────────────────────────────

export function TextInput({
  label,
  value,
  onChange,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Small helper under the label — where this field appears on the site. */
  hint?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[#8A8278] text-sm uppercase tracking-widest">{label}</label>
      {hint && (
        <p className="text-[#4A4540] text-xs leading-relaxed -mt-0.5 mb-0.5">{hint}</p>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent border-b border-[#3A3530] text-[#F2EDE5] py-2 text-sm focus:outline-none focus:border-[#C8A96E] transition-colors placeholder:text-[#3A3530]"
      />
    </div>
  );
}

export function TextareaInput({
  label,
  value,
  onChange,
  rows = 3,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[#8A8278] text-sm uppercase tracking-widest">{label}</label>
      {hint && (
        <p className="text-[#4A4540] text-xs leading-relaxed -mt-0.5 mb-0.5">{hint}</p>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="bg-[#0A0908] border border-[#3A3530] text-[#F2EDE5] py-2 px-3 text-sm focus:outline-none focus:border-[#C8A96E] transition-colors resize-y placeholder:text-[#3A3530]"
      />
    </div>
  );
}

export function CheckboxInput({
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

export function TagsInput({
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
