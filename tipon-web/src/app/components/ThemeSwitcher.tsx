import { Check, Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { TriggerButton } from "./TriggerButton";
import { cn } from "./ui/utils";
import { THEMES, useTheme } from "../theme/ThemeProvider";

// Small swatch previewing each theme's surface + accent.
function Swatch({ theme }: { theme: (typeof THEMES)[number]["value"] }) {
  const colors: Record<typeof theme, { bg: string; accent: string }> = {
    gold: { bg: "oklch(0.205 0.028 264)", accent: "oklch(0.81 0.15 79)" },
    teal: { bg: "oklch(0.205 0.022 220)", accent: "oklch(0.77 0.12 185)" },
    sunset: { bg: "oklch(0.205 0.035 330)", accent: "oklch(0.72 0.18 18)" },
  };
  const c = colors[theme];
  return (
    <span
      className="flex size-5 shrink-0 items-center justify-center rounded-full border"
      style={{ background: c.bg, borderColor: c.accent }}
    >
      <span className="size-2.5 rounded-full" style={{ background: c.accent }} />
    </span>
  );
}

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <TriggerButton variant="ghost" size="icon" aria-label="Change theme">
          <Palette className="size-5" />
        </TriggerButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value)}
            className="gap-3"
          >
            <Swatch theme={t.value} />
            <div className="min-w-0 flex-1">
              <p className="text-sm">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </div>
            <Check className={cn("size-4 shrink-0", theme === t.value ? "opacity-100" : "opacity-0")} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
