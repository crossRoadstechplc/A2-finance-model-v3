import { assumptionsToEngineInput } from "@/engine/adapter"
import { runEngine } from "@/engine/runEngine"
import type { EngineOutput, RunEngineFn } from "@/engine/types"
import { applyAssumptionsFromSnapshot } from "@/store/applyAssumptionsFromSnapshot"
import { getDefaultEcisDataState } from "@/store/defaults"
import type { AssumptionsSnapshot, EcisDataState } from "@/store/types"

/** Minimal `EcisDataState` for `assumptionsToEngineInput` (same adapter path as `orchestrateRecompute`). */
export function buildEcisDataStateForEngineRun(
  snap: AssumptionsSnapshot,
): EcisDataState {
  return {
    ...getDefaultEcisDataState(),
    ...applyAssumptionsFromSnapshot(snap),
  }
}

/**
 * Runs the projection through the same adapter → `runEngine` path as the live recompute orchestrator.
 */
export function runEngineForAssumptionsSnapshot(
  snap: AssumptionsSnapshot,
  options?: { runEngineImpl?: RunEngineFn },
): EngineOutput {
  const data = buildEcisDataStateForEngineRun(snap)
  const impl = options?.runEngineImpl ?? runEngine
  return impl(assumptionsToEngineInput(data))
}
