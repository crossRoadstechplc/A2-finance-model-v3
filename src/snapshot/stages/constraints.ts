import type { PipelineContext } from "@/snapshot/pipelineContext"

const GAP_EPS = 1e-3

export function runConstraintsStage(ctx: PipelineContext): PipelineContext {
  const d = ctx.demand
  const inf = ctx.infrastructure
  if (!d || !inf) return ctx

  const requiredChargedBatteries = Math.ceil(
    d.dailyEnergyDemandKwh / Math.max(1e-9, d.batteryCapacityKwh),
  )

  if (d.dailyEnergyDemandKwh - inf.maxDailyChargingKwh > GAP_EPS) {
    ctx.constraints.push({
      code: "CHARGING_SOCKET_THROUGHPUT_SHORTFALL",
      stage: "constraints",
      binding: true,
      message:
        "Daily charging energy demand exceeds socket + window + utilization capacity",
      shortfall: d.dailyEnergyDemandKwh - inf.maxDailyChargingKwh,
    })
  }

  if (requiredChargedBatteries - inf.maxChargedBatteriesPerNight > GAP_EPS) {
    ctx.constraints.push({
      code: "CHARGED_BATTERY_PRODUCTION_SHORTFALL",
      stage: "constraints",
      binding: true,
      message:
        "Nightly charged-battery output is below the batteries required for next-day corridor demand",
      shortfall: requiredChargedBatteries - inf.maxChargedBatteriesPerNight,
    })
  }

  if (d.dailySwapDemand - inf.maxDailySwapThroughput > GAP_EPS) {
    ctx.constraints.push({
      code: "SWAP_BAY_THROUGHPUT_SHORTFALL",
      stage: "constraints",
      binding: true,
      message:
        "Daily swap demand exceeds bay throughput within the charging window",
      shortfall: d.dailySwapDemand - inf.maxDailySwapThroughput,
    })
  }

  return ctx
}
