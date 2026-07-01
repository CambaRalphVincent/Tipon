import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { cn } from "../components/ui/utils";

export type ThemeName = "gold" | "teal" | "sunset";

export const THEMES: { value: ThemeName; label: string; description: string }[] = [
  { value: "gold", label: "Bayanihan Gold", description: "Navy + warm golden-amber" },
  { value: "teal", label: "Tropical Teal", description: "Dark slate + teal/emerald" },
  { value: "sunset", label: "Festival Sunset", description: "Dark plum + coral/magenta" },
];

const STORAGE_KEY = "tipon-theme";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window === "undefined") return "gold";
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    return stored ?? "teal";
  });

  // Apply theme classes to <html> so Radix portals (dropdowns, dialogs,
  // popovers, toasts) — which render at document.body — inherit the tokens.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.add("dark");
    root.classList.remove("theme-gold", "theme-teal", "theme-sunset");
    if (theme !== "gold") root.classList.add(`theme-${theme}`);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      <div className={cn("min-h-screen bg-background text-foreground")}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
