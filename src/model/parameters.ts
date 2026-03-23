import type { EngineInput } from "@/engine/types"
import type { ScenarioSnapshotOutput } from "@/snapshot/types"

/**
 * Resolved projection tunables used by `runModel`.
 * The app now derives these from the entity assumptions first, with a small
 * override layer preserved for deterministic tests.
 */
export type ProjectionModelParameters = {
  infrastructureUsefulLifeYears: number
  truckUsefulLifeYears: number
  truckCapexUsdPerVehicle: number
  platformInitialCapexUsd: number
  platformUsefulLifeYears: number
  platformAnnualOpexUsd: number
  batteryPackTotalCostUsd: number
  batterySalvageUsd: number
  batteryTotalCycles: number
  kwhPerBatteryCycle: number
  debtShareOfEnergyCapex: number
  loanNominalAnnualRate: number
  loanTenorPeriods: number
  sinkingFundTargetFutureValueUsd: number
  sinkingFundPeriodRate: number
  fleetRevenueUsdPerVehicleYear: number
  cashTaxRate: number
}

export function defaultProjectionModelParametersForScenario(
  input: EngineInput,
  scenario: ScenarioSnapshotOutput,
): ProjectionModelParameters {
  const batteryUnits = Math.max(0, scenario.pipeline.infrastructure.batteryPoolSize)
  const batteryPackTotalCostUsd =
    batteryUnits * Math.max(0, input.energy.batteryCostPerUnitUsd)
  const annualDistancePerTruckKm =
    Math.max(0, input.platform.corridorDistanceKm) *
    Math.max(0, input.fleet.tripsPerTruckPerDay) *
    365
  const annualFreightRevenuePerTruck =
    Math.max(0, input.fleet.freightRatePerTonKmUsd) *
    Math.max(0, input.fleet.averagePayloadTons) *
    annualDistancePerTruckKm
  const platformInitialCapexUsd =
    Math.max(0, scenario.pipeline.infrastructure.stations) *
      Math.max(0, input.platform.stationCapexUsd) +
    Math.max(0, scenario.pipeline.infrastructure.sockets) *
      Math.max(0, input.platform.chargingSocketCapexUsd) +
    Math.max(0, scenario.pipeline.infrastructure.bays) *
      Math.max(0, input.platform.swapBayCapexUsd) +
    Math.max(0, scenario.pipeline.infrastructure.stations) *
      Math.max(0, input.platform.cooledWarehouseSizeSqmPerStation) *
      Math.max(0, input.platform.cooledWarehouseCapexPerSqmUsd) +
    Math.max(0, input.platform.softwareDevelopmentCostUsd)

  return {
    infrastructureUsefulLifeYears: Math.max(1, input.platform.equipmentUsefulLifeYears),
    truckUsefulLifeYears: Math.max(1, input.fleet.truckUsefulLifeYears),
    truckCapexUsdPerVehicle: Math.max(0, input.fleet.truckPurchaseCostUsd),
    platformInitialCapexUsd,
    platformUsefulLifeYears: Math.max(1, input.platform.softwareUsefulLifeYears),
    platformAnnualOpexUsd:
      Math.max(0, input.platform.softwareMaintenanceCostUsdPerYear) +
      Math.max(0, input.platform.adminOverheadUsdPerYear),
    batteryPackTotalCostUsd,
    batterySalvageUsd:
      batteryUnits * Math.max(0, input.energy.batteryResidualValueUsd),
    batteryTotalCycles:
      Math.max(1, batteryUnits) * Math.max(1, input.energy.batteryCycleLife),
    kwhPerBatteryCycle: Math.max(1, input.energy.batteryCapacityKwh),
    debtShareOfEnergyCapex: Math.max(0, Math.min(1, input.energy.debtSharePercent / 100)),
    loanNominalAnnualRate: Math.max(0, input.energy.costOfDebtPercent / 100),
    loanTenorPeriods: Math.max(1, Math.min(input.horizon.periodCount, 10)),
    sinkingFundTargetFutureValueUsd:
      batteryPackTotalCostUsd *
      Math.max(0, input.energy.sinkingFundGrowthBufferPercent / 100),
    sinkingFundPeriodRate: Math.max(0, input.horizon.discountRatePerPeriod),
    fleetRevenueUsdPerVehicleYear: annualFreightRevenuePerTruck,
    cashTaxRate: 0,
  }
}

export function mergeProjectionModelParameters(
  base: ProjectionModelParameters,
  partial?: Partial<ProjectionModelParameters>,
): ProjectionModelParameters {
  if (!partial) return base
  return { ...base, ...partial }
}
