import { netPresentValue } from "@/finance/npv"

import {
  ENGINE_OUTPUT_VERSION,
  type EngineInput,
  type EngineOutput,
  type EnginePeriodPoint,
  type EngineProjectionResult,
  type EngineSnapshotBlock,
} from "@/engine/types"
import type { ModelRunOutput } from "@/model/types"
import { runModel } from "@/model/runModel"
import { buildScenarioRunInput, runScenario } from "@/snapshot/runScenario"

function runProjectionFacet(input: EngineInput): EngineProjectionResult {
  try {
    const { renewableTargetPercent } = input.energy
    if (renewableTargetPercent < 0 || renewableTargetPercent > 100) {
      return {
        status: "failed",
        error: "renewableTargetPercent must be within [0, 100]",
      }
    }

    const scenario = runScenario(buildScenarioRunInput(input))

    let model: ModelRunOutput | undefined
    try {
      model = runModel(input, scenario)
    } catch {
      model = undefined
    }

    const n = input.horizon.periodCount
    const annualNet = scenario.pipeline.entityFinancials.annualNetCashUsd
    const perPeriodChart = annualNet / Math.max(1, n)

    const periods: EnginePeriodPoint[] = []
    for (let i = 0; i < n; i++) {
      periods.push({
        periodIndex: i + 1,
        placeholderNetCash: perPeriodChart,
      })
    }

    const cashFlows: number[] = [-scenario.pipeline.capex.totalCapexUsd]
    for (let i = 0; i < n; i++) {
      cashFlows.push(annualNet)
    }

    const { npv } = netPresentValue({
      periodRate: input.horizon.discountRatePerPeriod,
      cashFlows,
    })

    if (!Number.isFinite(npv)) {
      return { status: "failed", error: "NPV could not be computed" }
    }

    return {
      status: "ok",
      periods,
      headlineNpv: npv,
      scenario,
      ...(model !== undefined ? { model } : {}),
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { status: "failed", error: msg }
  }
}

function runSnapshotFacet(input: EngineInput): EngineSnapshotBlock {
  try {
    const name = input.platform.corridorName.trim()
    if (name.length === 0) {
      return { status: "failed", error: "corridorName is required" }
    }
    if (!Number.isFinite(input.platform.stagingPhases) || input.platform.stagingPhases < 0) {
      return { status: "failed", error: "stagingPhases must be non-negative" }
    }
    return {
      status: "ok",
      capturedAt: new Date().toISOString(),
      label: name,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { status: "failed", error: msg }
  }
}

/**
 * Pure engine: runs projection + snapshot facets independently so one can fail without the other.
 */
export function runEngine(input: EngineInput): EngineOutput {
  const computedAt = new Date().toISOString()
  return {
    version: ENGINE_OUTPUT_VERSION,
    computedAt,
    projection: runProjectionFacet(input),
    engineSnapshot: runSnapshotFacet(input),
  }
}
