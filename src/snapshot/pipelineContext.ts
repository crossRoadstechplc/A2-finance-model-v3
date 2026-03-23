import type { EngineInput } from "@/engine/types"

import type { SnapshotModelParameters } from "@/snapshot/parameters"
import type { ScalingBandRow } from "@/snapshot/scalingBands"
import type {
  CapexStageOutput,
  DemandStageOutput,
  EntityFinancialsStageOutput,
  InfrastructureStageOutput,
  PricingStageOutput,
  SnapshotConstraint,
  SnapshotWarning,
  ViabilityStageOutput,
} from "@/snapshot/types"

export type ScenarioRunInput = {
  engine: EngineInput
  snapshotModel: SnapshotModelParameters
  scalingBands: readonly ScalingBandRow[]
}

export type PipelineContext = {
  input: ScenarioRunInput
  warnings: SnapshotWarning[]
  demand: DemandStageOutput | null
  infrastructure: InfrastructureStageOutput | null
  capex: CapexStageOutput | null
  pricing: PricingStageOutput | null
  entityFinancials: EntityFinancialsStageOutput | null
  constraints: SnapshotConstraint[]
  viability: ViabilityStageOutput | null
}

export function createPipelineContext(input: ScenarioRunInput): PipelineContext {
  return {
    input,
    warnings: [],
    demand: null,
    infrastructure: null,
    capex: null,
    pricing: null,
    entityFinancials: null,
    constraints: [],
    viability: null,
  }
}

export function pushWarning(ctx: PipelineContext, w: SnapshotWarning): void {
  ctx.warnings.push(w)
}
