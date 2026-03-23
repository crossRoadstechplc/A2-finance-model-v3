import { useEffect, useMemo, useRef } from "react"
import { useShallow } from "zustand/shallow"

import { ASSUMPTION_RECOMPUTE_DEBOUNCE_MS } from "@/config/timing"
import { selectPersistedAssumptionPick } from "@/store/persistedAssumptionPick"
import { useEcisStore } from "@/store/ecisStore"

/**
 * After any persisted assumption changes, schedules a call to the store's central `recompute`.
 * The first serialized fingerprint is baseline only (no run). Survives Strict Mode double effects
 * when the fingerprint is unchanged.
 */
export function useDebouncedAssumptionRecompute(
  delayMs = ASSUMPTION_RECOMPUTE_DEBOUNCE_MS,
) {
  const fingerprint = useEcisStore(useShallow(selectPersistedAssumptionPick))

  const serialized = useMemo(() => JSON.stringify(fingerprint), [fingerprint])
  const prevSerialized = useRef<string | null>(null)

  useEffect(() => {
    if (prevSerialized.current === null) {
      prevSerialized.current = serialized
      return
    }
    if (prevSerialized.current === serialized) {
      return
    }
    prevSerialized.current = serialized
    const id = window.setTimeout(() => {
      useEcisStore.getState().recompute()
    }, delayMs)
    return () => window.clearTimeout(id)
  }, [serialized, delayMs])
}
