import type { ReactNode } from "react"

type PageStubProps = {
  title: string
  description?: string
  children?: ReactNode
  /** Sets `data-ecis-section` for onboarding `ecisOnboarding.focusPageSection`. */
  mainSectionId?: string
}

export function PageStub({
  title,
  description,
  children,
  mainSectionId,
}: PageStubProps) {
  return (
    <div
      className="space-y-4 px-3 py-4 sm:px-6 sm:py-6"
      {...(mainSectionId
        ? {
            "data-ecis-section": mainSectionId,
            tabIndex: -1 as const,
          }
        : {})}
    >
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </div>
  )
}
