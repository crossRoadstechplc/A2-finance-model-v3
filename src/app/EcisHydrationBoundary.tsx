import { type ReactNode, useEffect, useRef, useState } from "react"

import { BrandMark } from "@/components/brand/BrandMark"
import { useEcisStore } from "@/store/ecisStore"

type Props = { children: ReactNode }

/**
 * Avoids flashing persisted defaults before localStorage rehydration completes.
 * Announces status for assistive tech while the workspace loads.
 */
export function EcisHydrationBoundary({ children }: Props) {
  const [hydrated, setHydrated] = useState(() =>
    useEcisStore.persist.hasHydrated(),
  )
  const ranInitialRecompute = useRef(false)

  useEffect(() => {
    return useEcisStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })
  }, [])

  /** First paint after storage merge: run engine once so dashboard/exports aren’t stuck idle. */
  useEffect(() => {
    if (!hydrated || ranInitialRecompute.current) return
    ranInitialRecompute.current = true
    queueMicrotask(() => {
      useEcisStore.getState().recompute()
    })
  }, [hydrated])

  if (!hydrated) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-foreground"
        role="status"
        aria-live="polite"
        aria-busy="true"
        data-testid="ecis-hydration-loading"
      >
        <BrandMark variant="splash" className="opacity-90" />
        <p className="text-sm text-muted-foreground">Loading workspace…</p>
      </div>
    )
  }

  return children
}
