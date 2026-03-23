import { clamp } from "@/finance/math"

import type { PipelineContext } from "@/snapshot/pipelineContext"

export function runPricingStage(ctx: PipelineContext): PipelineContext {
  const m = ctx.input.snapshotModel
  const grid = Math.max(0, m.gridPassThroughUsdPerKwh)
  const e = Math.max(0, m.a2EnergyUsdPerKwh)
  const p = Math.max(0, m.a2PlatformUsdPerKwh)
  const total = clamp(grid + e + p, 0, Number.POSITIVE_INFINITY)

  ctx.pricing = {
    gridPassThroughUsdPerKwh: grid,
    a2EnergyUsdPerKwh: e,
    a2PlatformUsdPerKwh: p,
    totalRetailUsdPerKwh: total,
  }

  return ctx
}
