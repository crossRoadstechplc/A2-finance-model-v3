import { clamp } from "@/finance/math"

import type { PipelineContext } from "@/snapshot/pipelineContext"

export function runDemandStage(ctx: PipelineContext): PipelineContext {
  const { fleet, platform, energy } = ctx.input.engine
  const { snapshotModel } = ctx.input

  const vehicles = Number.isFinite(fleet.vehicleCount)
    ? Math.max(0, fleet.vehicleCount)
    : 0
  const utilization = clamp(fleet.utilizationPercent / 100, 0, 1)
  const operatingFleetVehicles = vehicles * utilization
  const tripsPerTruckPerDay = Math.max(0, fleet.tripsPerTruckPerDay)
  const corridorDistanceKm = Math.max(0, platform.corridorDistanceKm)
  const kwhPerKm = Math.max(0, energy.kwhConsumptionPerKm)
  const batteryCapacityKwh = Math.max(1e-9, energy.batteryCapacityKwh)
  const dailyDistancePerTruckKm = corridorDistanceKm * tripsPerTruckPerDay
  const dailyEnergyPerTruckKwh = dailyDistancePerTruckKm * kwhPerKm

  const fleetChargingShare = clamp(snapshotModel.fleetChargingShare, 0, 1)
  const chargingTrucks = operatingFleetVehicles * fleetChargingShare
  const swapTrucks = operatingFleetVehicles * (1 - fleetChargingShare)

  const legacyTruckDayEnergy = Math.max(0, snapshotModel.kwhPerChargingTruckDay)
  const effectiveEnergyPerTruckKwh =
    dailyEnergyPerTruckKwh > 0 ? dailyEnergyPerTruckKwh : legacyTruckDayEnergy

  const dailyEnergyDemandKwh = operatingFleetVehicles * effectiveEnergyPerTruckKwh
  const dailySwapDemand = swapTrucks * Math.max(1, tripsPerTruckPerDay)

  ctx.demand = {
    exogenousFleetVehicles: vehicles,
    operatingFleetVehicles,
    fleetChargingShare,
    chargingTrucks,
    swapTrucks,
    tripsPerTruckPerDay,
    corridorDistanceKm,
    kwhPerKm,
    batteryCapacityKwh,
    dailyDistancePerTruckKm,
    dailyEnergyPerTruckKwh: effectiveEnergyPerTruckKwh,
    dailyEnergyDemandKwh,
    dailySwapDemand,
  }

  return ctx
}
