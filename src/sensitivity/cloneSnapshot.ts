import type { AssumptionsSnapshot } from "@/store/types"

/** Structured clone for sensitivity sweeps — assumptions stay immutable in the store. */
export function cloneAssumptionsSnapshot(s: AssumptionsSnapshot): AssumptionsSnapshot {
  return structuredClone(s)
}
