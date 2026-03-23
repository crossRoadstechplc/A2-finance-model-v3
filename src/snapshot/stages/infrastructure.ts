import { clamp } from "@/finance/math"

import { pushWarning, type PipelineContext } from "@/snapshot/pipelineContext"
import { selectScalingBandFromRows } from "@/snapshot/scalingBands"

function resolveCount(
  override: number | null,
  baseline: number,
  kind: "stations" | "sockets" | "bays",
  ctx: PipelineContext,
): { value: number; usedOverride: boolean } {
  if (override === null) {
    return { value: baseline, usedOverride: false }
  }
  pushWarning(ctx, {
    code: "SNAPSHOT_INFRASTRUCTURE_OVERRIDE_ACTIVE",
    severity: "info",
    stage: "infrastructure",
    message: `User override applied for ${kind}`,
  })
  let v = Math.trunc(override)
  if (v < 0) {
    pushWarning(ctx, {
      code: "SNAPSHOT_OVERRIDE_CLAMPED_NEGATIVE",
      severity: "warn",
      stage: "infrastructure",
      message: `${kind} override was negative; clamped to 0`,
    })
    v = 0
  }
  return { value: v, usedOverride: true }
}

export function runInfrastructureStage(ctx: PipelineContext): PipelineContext {
  const { snapshotModel, engine } = ctx.input
  const vehicles = ctx.demand?.exogenousFleetVehicles ?? 0

  const band = selectScalingBandFromRows(vehicles, ctx.input.scalingBands)
  const ov = snapshotModel.infrastructureOverrides

  const stations = resolveCount(
    ov.stations,
    band.baseStations,
    "stations",
    ctx,
  )
  const sockets = resolveCount(ov.sockets, band.baseSockets, "sockets", ctx)
  const bays = resolveCount(ov.bays, band.baseBays, "bays", ctx)

  const startHour = Math.round(engine.energy.chargingWindowStartHour)
  const endHour = Math.round(engine.energy.chargingWindowEndHour)
  const rawWindowH =
    endHour >= startHour ? endHour - startHour : 24 - startHour + endHour
  const chargingWindowHours = rawWindowH > 0
    ? rawWindowH
    : clamp(snapshotModel.chargingWindowHoursPerDay, 0, 24)
  const chargeTimeMinutes = Math.max(1, engine.energy.chargeTimeMinutes)
  const chargeWindowMinutes = chargingWindowHours * 60
  const chargesPerSocketPerNight = Math.floor(chargeWindowMinutes / chargeTimeMinutes)
  const batteryCapacityKwh = Math.max(0, engine.energy.batteryCapacityKwh)
  const maxChargedBatteriesPerNight = sockets.value * Math.max(0, chargesPerSocketPerNight)
  const maxDailyChargingKwh = maxChargedBatteriesPerNight * batteryCapacityKwh

  const swapMinutes = Math.max(1, engine.energy.swapTimeMinutes)
  const swapHoursPerDay = 24
  const swapsPerBayPerDay = Math.floor((swapHoursPerDay * 60) / swapMinutes)
  const maxDailySwapThroughput = bays.value * Math.max(0, swapsPerBayPerDay)

  const batteryPoolRatio = Math.max(0, engine.energy.batteryPoolRatio)
  const batteryPoolByRatio = Math.ceil(Math.max(0, vehicles) * batteryPoolRatio)
  const batteryPoolSize = Math.max(band.defaultBatteryPool, batteryPoolByRatio)

  ctx.infrastructure = {
    scalingBandId: band.id,
    stations: stations.value,
    sockets: sockets.value,
    bays: bays.value,
    defaultBatteryPool: band.defaultBatteryPool,
    batteryPoolSize,
    socketsPerStation:
      stations.value > 0 ? sockets.value / stations.value : 0,
    baysPerStation:
      stations.value > 0 ? bays.value / stations.value : 0,
    overrideApplied: {
      stations: stations.usedOverride,
      sockets: sockets.usedOverride,
      bays: bays.usedOverride,
    },
    maxDailyChargingKwh,
    maxDailySwapThroughput,
    bandBaseCapexUsd: band.baseCapexUsd,
    chargingWindowHours,
    chargeTimeMinutes,
    chargesPerSocketPerNight: Math.max(0, chargesPerSocketPerNight),
    maxChargedBatteriesPerNight,
  }

  return ctx
}
