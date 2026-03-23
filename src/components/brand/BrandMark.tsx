import { BRANDING } from "@/config/branding"
import { cn } from "@/lib/utils"

type BrandMarkProps = {
  className?: string
  /** Layout: horizontal lockup or stacked text beside the mark. */
  layout?: "horizontal" | "stacked"
  /** Logo-only (e.g. splash) — product name is screen-reader only. */
  variant?: "full" | "splash"
}

export function BrandMark({
  className,
  layout = "horizontal",
  variant = "full",
}: BrandMarkProps) {
  const isSplash = variant === "splash"

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2",
        layout === "stacked" && "flex-col items-start gap-1",
        className,
      )}
    >
      <img
        src={BRANDING.logoSrc}
        alt=""
        width={isSplash ? 48 : 36}
        height={isSplash ? 48 : 36}
        decoding="async"
        className={cn(
          "shrink-0 rounded-md object-contain",
          isSplash ? "h-12 w-12" : "h-9 w-9",
        )}
      />
      {isSplash ? (
        <span className="sr-only">{BRANDING.productName}</span>
      ) : (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {BRANDING.shortName}
          </p>
          <p className="truncate text-sm font-semibold text-sidebar-foreground">
            {BRANDING.shellTagline}
          </p>
        </div>
      )}
    </div>
  )
}
