import type { PipelineContext } from "@/snapshot/pipelineContext"

const OPEX_PER_STATION_USD = 85_000

export function runEntityFinancialsStage(ctx: PipelineContext): PipelineContext {
  const d = ctx.demand
  const inf = ctx.infrastructure
  const pr = ctx.pricing
  if (!d || !inf || !pr) return ctx

  const annualEnergyKwh = d.dailyEnergyDemandKwh * 365
  const annualSwaps = d.dailySwapDemand * 365
  const swapFee = Math.max(
    0,
    ctx.input.snapshotModel.swapServiceUsdPerSwap,
  )

  const energyRevenue = annualEnergyKwh * pr.totalRetailUsdPerKwh
  const swapRevenue = annualSwaps * swapFee
  const annualRevenueUsd = energyRevenue + swapRevenue

  const annualGridCostUsd = annualEnergyKwh * pr.gridPassThroughUsdPerKwh
  const annualOpexUsd = inf.stations * OPEX_PER_STATION_USD

  const annualNetCashUsd =
    annualRevenueUsd - annualGridCostUsd - annualOpexUsd

  ctx.entityFinancials = {
    annualEnergySoldKwh: annualEnergyKwh,
    annualRevenueUsd,
    annualGridCostUsd,
    annualOpexUsd,
    annualNetCashUsd,
  }

  return ctx
}
