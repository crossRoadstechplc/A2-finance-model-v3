import type { RunEngineFn } from "@/engine/types"
import { runEngine } from "@/engine/runEngine"
import { runBreakevenAnalysis } from "@/sensitivity/breakeven"
import { runTornadoAnalysis } from "@/sensitivity/tornado"
import { buildTwoWaySensitivityGrid } from "@/sensitivity/twoWay"
import type { AssumptionsSnapshot } from "@/store/types"

export type SensitivityAnalysisPayload = {
  tornado: ReturnType<typeof runTornadoAnalysis>
  twoWay: ReturnType<typeof buildTwoWaySensitivityGrid>
  breakeven: ReturnType<typeof runBreakevenAnalysis>
  warnings: string[]
  degraded: boolean
}

export function createBudgetedRunEngine(
  impl: RunEngineFn,
  maxCalls: number,
  maxMs: number,
): RunEngineFn {
  let n = 0
  const t0 = Date.now()
  return (input) => {
    if (n >= maxCalls || Date.now() - t0 > maxMs) {
      throw new Error("sensitivity-budget-exceeded")
    }
    n++
    return impl(input)
  }
}

export function runFullSensitivityAnalysis(
  baseSnap: AssumptionsSnapshot,
  options?: {
    runEngineImpl?: RunEngineFn
    maxEngineCalls?: number
    maxDurationMs?: number
  },
): SensitivityAnalysisPayload {
  const maxCalls = options?.maxEngineCalls ?? 200
  const maxMs = options?.maxDurationMs ?? 14_000
  const baseImpl = options?.runEngineImpl ?? runEngine
  const budgeted = createBudgetedRunEngine(baseImpl, maxCalls, maxMs)

  const tornado = runTornadoAnalysis(baseSnap, { runEngineImpl: budgeted })
  const twoWay = buildTwoWaySensitivityGrid(baseSnap, { runEngineImpl: budgeted })
  const breakeven = runBreakevenAnalysis(baseSnap, { runEngineImpl: budgeted })

  const warnings = [
    ...tornado.warnings,
    ...twoWay.warnings,
    ...breakeven.warnings,
  ]
  const degraded = warnings.some((w) => w.includes("sensitivity-budget-exceeded"))
  if (degraded) {
    warnings.push(
      "Some sensitivity blocks were limited by the engine call / time budget — results may be partial.",
    )
  }

  return { tornado, twoWay, breakeven, warnings, degraded }
}
