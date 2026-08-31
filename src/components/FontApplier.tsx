import { useEffect } from "react";
import appearanceSeed from "@/data/appearance.json";
import { useContent } from "@/lib/use-content";
import {
  googleFontsHref,
  mergeAppearance,
} from "@/lib/fonts";
import type { Appearance } from "@/components/admin/types";

const LINK_ID = "lenna-dynamic-fonts";

function applyAppearance(appearance: Appearance) {
  const root = document.documentElement;
  const display = appearance.displayFont.trim() || "Big Shoulders Display";
  const sans = appearance.sansFont.trim() || "Inter";
  const serif = appearance.serifFont.trim() || "Cormorant Garamond";
  root.style.setProperty("--app-font-display", `'${display}', sans-serif`);
  root.style.setProperty("--app-font-sans", `'${sans}', sans-serif`);
  root.style.setProperty("--app-font-serif", `'${serif}', serif`);

  const href = googleFontsHref(appearance.googleFamilies ?? []);
  let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
  if (!href) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement("link");
    link.id = LINK_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.href !== href) link.href = href;
}

/** Applies admin-chosen Google Fonts and CSS variables across the whole site. */
export function FontApplier() {
  const raw = useContent("appearance", appearanceSeed as Appearance);
  const appearance = mergeAppearance(raw);

  useEffect(() => {
    applyAppearance(appearance);
    // Field-level deps so a new object identity from mergeAppearance does not retrigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    appearance.displayFont,
    appearance.sansFont,
    appearance.serifFont,
    appearance.googleFamilies.join("|"),
  ]);

  return null;
}
