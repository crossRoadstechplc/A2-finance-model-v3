/** Phase 5 snapshot engine — stable warning/constraint codes for UI and tests. */

export const SNAPSHOT_SCENARIO_VERSION = 1 as const

export type PipelineStageId =
  | "demand"
  | "infrastructure"
  | "capex"
  | "pricing"
  | "entityFinancials"
  | "viability"
  | "constraints"

/** Stable warning envelope (codes are part of the contract). */
export type SnapshotWarning = {
  code: string
  severity: "info" | "warn"
  stage: PipelineStageId
  message: string
}

/** Stable constraint envelope (codes are part of the contract). */
export type SnapshotConstraint = {
  code: string
  stage: PipelineStageId
  binding: boolean
  message: string
  /** Physical gap (e.g. kWh/day or swaps/day missing) when applicable */
  shortfall?: number
}

export type DemandStageOutput = {
  exogenousFleetVehicles: number
  operatingFleetVehicles: number
  fleetChargingShare: number
  chargingTrucks: number
  swapTrucks: number
  tripsPerTruckPerDay: number
  corridorDistanceKm: number
  kwhPerKm: number
  batteryCapacityKwh: number
  dailyDistancePerTruckKm: number
  dailyEnergyPerTruckKwh: number
  dailyEnergyDemandKwh: number
  dailySwapDemand: number
}

export type InfrastructureStageOutput = {
  scalingBandId: string
  stations: number
  sockets: number
  bays: number
  defaultBatteryPool: number
  batteryPoolSize: number
  socketsPerStation: number
  baysPerStation: number
  overrideApplied: {
    stations: boolean
    sockets: boolean
    bays: boolean
  }
  /** Band anchor used by capex stage */
  bandBaseCapexUsd: number
  chargingWindowHours: number
  chargeTimeMinutes: number
  chargesPerSocketPerNight: number
  maxChargedBatteriesPerNight: number
  /** Max deliverable charging energy per day given window + sockets */
  maxDailyChargingKwh: number
  /** Max swap completions per day given window + bays */
  maxDailySwapThroughput: number
}

export type CapexStageOutput = {
  totalCapexUsd: number
  stationUnitCostUsd: number
  socketUnitCostUsd: number
  bayUnitCostUsd: number
}

export type PricingStageOutput = {
  gridPassThroughUsdPerKwh: number
  a2EnergyUsdPerKwh: number
  a2PlatformUsdPerKwh: number
  totalRetailUsdPerKwh: number
}

export type EntityFinancialsStageOutput = {
  annualEnergySoldKwh: number
  annualRevenueUsd: number
  annualGridCostUsd: number
  annualOpexUsd: number
  annualNetCashUsd: number
}

export type ViabilityStageOutput = {
  viable: boolean
  reasons: readonly string[]
}

export type ConstraintsStageOutput = {
  items: readonly SnapshotConstraint[]
}

export type ScenarioPipelineOutputs = {
  demand: DemandStageOutput
  infrastructure: InfrastructureStageOutput
  capex: CapexStageOutput
  pricing: PricingStageOutput
  entityFinancials: EntityFinancialsStageOutput
  viability: ViabilityStageOutput
  constraints: ConstraintsStageOutput
}

export type ScenarioSnapshotOutput = {
  version: typeof SNAPSHOT_SCENARIO_VERSION
  pipeline: ScenarioPipelineOutputs
  warnings: readonly SnapshotWarning[]
  /** Flattened constraints for convenience (same as pipeline.constraints.items) */
  constraints: readonly SnapshotConstraint[]
}
