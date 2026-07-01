import { ImageWithFallback } from "./figma/ImageWithFallback";
import { cn } from "./ui/utils";
import tiponLogo from "../../assets/Tipon_Logo_2.png";

interface BrandLogoProps {
  /** horizontal — icon left, text right (sidebar) */
  /** stacked — icon top, text bottom (auth panel) */
  layout?: "horizontal" | "stacked";
  className?: string;
}

export function BrandLogo({ layout = "horizontal", className }: BrandLogoProps) {
  const isStacked = layout === "stacked";

  return (
    <div
      className={cn(
        "flex items-center",
        isStacked ? "flex-col gap-3" : "flex-row gap-3",
        className,
      )}
    >
      <ImageWithFallback
        src={tiponLogo}
        alt="Tipon logo"
        className={cn(
          "shrink-0 object-contain",
          isStacked ? "h-28 w-28" : "h-11 w-11",
        )}
        style={{ filter: "invert(1) contrast(4)", mixBlendMode: "screen" }}
      />
      <div className={cn("leading-none", isStacked && "text-center")}>
        <p
          className={cn(
            "tracking-tight text-foreground",
            isStacked ? "text-4xl" : "text-xl",
          )}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}
        >
          Tipon
        </p>
        <p
          className={cn(
            "text-muted-foreground",
            isStacked ? "mt-1 text-sm" : "text-[11px]",
          )}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}
        >
          {isStacked ? "Event Registration System" : "Event Registration"}
        </p>
      </div>
    </div>
  );
}
