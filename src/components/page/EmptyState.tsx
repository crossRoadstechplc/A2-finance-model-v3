import type { HTMLAttributes, ReactNode } from "react"

import { cn } from "@/lib/utils"

type EmptyStateProps = {
  title?: string
  children: ReactNode
  className?: string
  /** For tests and onboarding `focusPageSection` targets. */
  id?: string
  variant?: "muted" | "warning"
} & Omit<HTMLAttributes<HTMLDivElement>, "title" | "role" | "children">

export function EmptyState({
  title,
  children,
  className,
  id,
  variant = "muted",
  ...rest
}: EmptyStateProps) {
  return (
    <div
      id={id}
      role="status"
      {...rest}
      className={cn(
        "rounded-md border border-dashed px-4 py-6 text-center text-sm",
        variant === "muted" &&
          "border-border bg-muted/30 text-muted-foreground",
        variant === "warning" &&
          "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100",
        className,
      )}
    >
      {title ? (
        <p className="mb-2 font-medium text-foreground/90">{title}</p>
      ) : null}
      <div className="mx-auto max-w-lg">{children}</div>
    </div>
  )
}
