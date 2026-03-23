import type { RunEngineFn } from "@/engine/types"
import {
  extractSensitivityMetrics,
  type SensitivityEngineMetrics,
} from "@/sensitivity/metrics"
import { runEngineForAssumptionsSnapshot } from "@/scenarios/runEngineForAssumptionsSnapshot"
import type { AssumptionsSnapshot } from "@/store/types"

export type SafeRunResult = {
  metrics: SensitivityEngineMetrics | null
  warning: string | null
}

export function runSensitivityCell(
  snap: AssumptionsSnapshot,
  options?: { runEngineImpl?: RunEngineFn },
): SafeRunResult {
  try {
    const out = runEngineForAssumptionsSnapshot(snap, {
      runEngineImpl: options?.runEngineImpl,
    })
    return { metrics: extractSensitivityMetrics(out), warning: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      metrics: null,
      warning: `Engine run failed: ${msg}`,
    }
  }
}
