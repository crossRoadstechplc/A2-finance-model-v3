import type { EngineInput } from "@/engine/types"

import {
  createPipelineContext,
  type ScenarioRunInput,
} from "@/snapshot/pipelineContext"
import { runCapexStage } from "@/snapshot/stages/capex"
import { runConstraintsStage } from "@/snapshot/stages/constraints"
import { runDemandStage } from "@/snapshot/stages/demand"
import { runEntityFinancialsStage } from "@/snapshot/stages/entityFinancials"
import { runInfrastructureStage } from "@/snapshot/stages/infrastructure"
import { runPricingStage } from "@/snapshot/stages/pricing"
import { runViabilityStage } from "@/snapshot/stages/viability"
import {
  SNAPSHOT_SCENARIO_VERSION,
  type ScenarioPipelineOutputs,
  type ScenarioSnapshotOutput,
} from "@/snapshot/types"

export function buildScenarioRunInput(engine: EngineInput): ScenarioRunInput {
  return {
    engine,
    snapshotModel: engine.snapshotModel,
    scalingBands: engine.scalingBands,
  }
}

/**
 * Ordered pipeline: demand → infrastructure → capex → pricing → entity financials
 * → constraints → viability. Always returns a full output object (even if non-viable).
 */
export function runScenario(input: ScenarioRunInput): ScenarioSnapshotOutput {
  let ctx = createPipelineContext(input)

  ctx = runDemandStage(ctx)
  ctx = runInfrastructureStage(ctx)
  ctx = runCapexStage(ctx)
  ctx = runPricingStage(ctx)
  ctx = runEntityFinancialsStage(ctx)
  ctx = runConstraintsStage(ctx)
  ctx = runViabilityStage(ctx)

  const demand = ctx.demand!
  const infrastructure = ctx.infrastructure!
  const capex = ctx.capex!
  const pricing = ctx.pricing!
  const entityFinancials = ctx.entityFinancials!
  const viability = ctx.viability!

  const pipeline: ScenarioPipelineOutputs = {
    demand,
    infrastructure,
    capex,
    pricing,
    entityFinancials,
    viability,
    constraints: { items: [...ctx.constraints] },
  }

  return {
    version: SNAPSHOT_SCENARIO_VERSION,
    pipeline,
    warnings: [...ctx.warnings],
    constraints: [...ctx.constraints],
  }
}
