import { createContext, useContext, useEffect, useRef, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "dark", toggle: () => {} });

/* Brand blue #1F67F1 = hsl(219 88% 53%) — single accent for both themes */
const DARK_VARS: Record<string, string> = {
  "--color-background":             "hsl(30 10% 4%)",
  "--color-foreground":             "hsl(38 33% 92%)",
  "--color-border":                 "hsl(30 8% 14%)",
  "--color-input":                  "hsl(30 8% 14%)",
  "--color-ring":                   "hsl(219 88% 53%)",
  "--color-card":                   "hsl(30 11% 7%)",
  "--color-card-foreground":        "hsl(38 33% 92%)",
  "--color-card-border":            "hsl(30 8% 14%)",
  "--color-popover":                "hsl(30 11% 7%)",
  "--color-popover-foreground":     "hsl(38 33% 92%)",
  "--color-popover-border":         "hsl(30 8% 14%)",
  "--color-primary":                "hsl(219 88% 53%)",
  "--color-primary-foreground":     "hsl(0 0% 100%)",
  "--color-secondary":              "hsl(30 8% 14%)",
  "--color-secondary-foreground":   "hsl(33 8% 51%)",
  "--color-muted":                  "hsl(30 8% 14%)",
  "--color-muted-foreground":       "hsl(33 8% 51%)",
  "--color-accent":                 "hsl(30 9% 21%)",
  "--color-accent-foreground":      "hsl(38 33% 92%)",
  "--color-destructive":            "hsl(0 84.2% 60.2%)",
  "--color-destructive-foreground": "hsl(0 0% 98%)",
};

const LIGHT_VARS: Record<string, string> = {
  /* Warm cream — sampled from designer swatch ≈ #F7F1DC */
  "--color-background":             "hsl(48 56% 94%)",
  "--color-foreground":             "hsl(25 8% 10%)",
  "--color-border":                 "hsl(30 8% 84%)",
  "--color-input":                  "hsl(30 8% 84%)",
  "--color-ring":                   "hsl(219 88% 53%)",
  "--color-card":                   "hsl(30 12% 96%)",
  "--color-card-foreground":        "hsl(25 8% 10%)",
  "--color-card-border":            "hsl(30 8% 84%)",
  "--color-popover":                "hsl(30 12% 96%)",
  "--color-popover-foreground":     "hsl(25 8% 10%)",
  "--color-popover-border":         "hsl(30 8% 84%)",
  "--color-primary":                "hsl(219 88% 53%)",
  "--color-primary-foreground":     "hsl(0 0% 100%)",
  "--color-secondary":              "hsl(30 8% 92%)",
  "--color-secondary-foreground":   "hsl(25 8% 20%)",
  "--color-muted":                  "hsl(30 8% 92%)",
  "--color-muted-foreground":       "hsl(25 10% 35%)",
  "--color-accent":                 "hsl(219 88% 53%)",
  "--color-accent-foreground":      "hsl(0 0% 100%)",
  "--color-destructive":            "hsl(0 72% 51%)",
  "--color-destructive-foreground": "hsl(0 0% 100%)",
};

/* Module-level lock used by the entry page to keep ThemeProvider's
   own effect from overwriting the forced-dark vars while `/` is
   mounted. Without this, a child useLayoutEffect (Entry) writing dark
   vars would still be overwritten by the parent's useEffect running
   later in the same commit if the user's saved theme is light. */
let entryDarkLock = false;

export function lockEntryDark() {
  entryDarkLock = true;
  applyThemeVars("dark");
}
export function unlockEntryDark() {
  entryDarkLock = false;
  applyThemeVars(readSavedTheme());
}
export function isEntryDarkLocked() {
  return entryDarkLock;
}

export function applyThemeVars(theme: Theme) {
  const root = document.documentElement;
  const vars = theme === "dark" ? DARK_VARS : LIGHT_VARS;
  Object.entries(vars).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });
  if (theme === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Inner pages default to LIGHT when the visitor has no saved
    // preference. The entry page (/) is forced dark via lockEntryDark.
    try {
      const saved = localStorage.getItem("lenna-theme");
      return saved === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  // Track first commit so we don't write `lenna-theme` to localStorage
  // just because the provider mounted on the entry route. Persisting
  // the *initial* value would mutate the visitor's saved preference
  // (it would create a "dark" entry on first ever visit). We only
  // persist after a real toggle.
  const firstCommit = useRef(true);

  useEffect(() => {
    // Respect the entry-page lock so we don't repaint to the saved
    // theme while `/` is forcing dark. The lock is released on entry
    // unmount, at which point the visitor's saved theme is restored.
    if (!entryDarkLock) {
      applyThemeVars(theme);
    }
    if (firstCommit.current) {
      firstCommit.current = false;
      return;
    }
    try {
      localStorage.setItem("lenna-theme", theme);
    } catch {}
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

/* Read the visitor's saved theme without subscribing — used by the
   entry page on unmount to restore the inner-page theme synchronously
   before the next page paints. Returns "dark" for SSR/private mode. */
export function readSavedTheme(): Theme {
  // Mirror ThemeProvider's default — light unless the visitor has
  // explicitly opted into dark mode.
  try {
    const saved = localStorage.getItem("lenna-theme");
    return saved === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}
