/** Shared brand tokens. Kept in sync with CSS vars in `src/index.css`. */

export const BRAND = {
  blue:  "#1F67F1",
  pink:  "#EC4899",
  coral: "#E8715A",
  teal:  "#6DB8A2",
} as const;

export const BRAND_RGB: Record<string, string> = {
  [BRAND.blue]:  "31,103,241",
  [BRAND.pink]:  "236,72,153",
  [BRAND.coral]: "232,113,90",
  [BRAND.teal]:  "109,184,162",
};

export const BRAND_DECK = [
  BRAND.blue,
  BRAND.pink,
  BRAND.coral,
  BRAND.teal,
] as const;

export const BRAND_EASE = [0.16, 1, 0.3, 1] as const;

export const BRAND_HOVER = {
  lift: -8,
  rotate: 0.5,
} as const;
