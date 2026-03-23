import type { ModelRunOutput } from "@/model/types"
import type { SnapshotModelParameters } from "@/snapshot/parameters"
import type { ScalingBandRow } from "@/snapshot/scalingBands"
import type { ScenarioSnapshotOutput } from "@/snapshot/types"

/** Normalized boundary types — framework-agnostic, versioned for migrations. */

export const ENGINE_INPUT_VERSION = 3 as const
export const ENGINE_OUTPUT_VERSION = 1 as const

export type EngineHorizon = {
  /** Number of annual(ized) model periods */
  periodCount: number
  /**
   * Discount rate per period as **decimal** (period = one horizon step).
   * Adapter maps from `system.discountRatePercent / 100`.
   */
  discountRatePerPeriod: number
  /** Inflation per period, decimal (from `system.inflationAssumptionPercent / 100`) */
  inflationRatePerPeriod: number
}

export type EnginePlatformInput = {
  corridorName: string
  stagingPhases: number
  goLiveYear: number
  interoperabilityTier: "baseline" | "enhanced" | "advanced"
  corridorDistanceKm: number
  staffPerStation: number
  staffCostPerPersonPerYearUsd: number
  cooledWarehouseSizeSqmPerStation: number
  stationCapexUsd: number
  swapBayCapexUsd: number
  chargingSocketCapexUsd: number
  cooledWarehouseCapexPerSqmUsd: number
  softwareDevelopmentCostUsd: number
  softwareMaintenanceCostUsdPerYear: number
  maintenancePercentInfraCapex: number
  insurancePercentAssets: number
  platformFeeTargetUsdPerKwh: number
  stationUsefulLifeYears: number
  equipmentUsefulLifeYears: number
  softwareUsefulLifeYears: number
  taxRatePercent: number
  debtSharePercent: number
  costOfDebtPercent: number
  targetEquityReturnPercent: number
  adminOverheadUsdPerYear: number
}

export type EngineEnergyInput = {
  gridCarbonIntensityGPerKwh: number
  renewableTargetPercent: number
  peakDemandMw: number
  batteryCostPerUnitUsd: number
  batteryCycleLife: number
  batteryCapacityKwh: number
  chargeTimeMinutes: number
  swapTimeMinutes: number
  chargingWindowStartHour: number
  chargingWindowEndHour: number
  kwhConsumptionPerKm: number
  gridElectricityTariffUsdPerKwh: number
  batteryPoolRatio: number
  targetMarginPerCycleUsd: number
  sinkingFundContributionPerCycleUsd: number
  sinkingFundGrowthBufferPercent: number
  batteryResidualValueUsd: number
  insurancePerBatteryPerYearUsd: number
  monitoringPerBatteryPerYearUsd: number
  taxRatePercent: number
  debtSharePercent: number
  costOfDebtPercent: number
  targetEquityReturnPercent: number
}

export type EngineFleetInput = {
  vehicleCount: number
  utilizationPercent: number
  averageDutyCycleHours: number
  annualTruckPlan: readonly {
    yearIndex: number
    truckCount: number
  }[]
  tripsPerTruckPerDay: number
  freightRatePerTonKmUsd: number
  averagePayloadTons: number
  dieselBenchmarkPricePerLiterUsd: number
  dieselTruckFuelConsumptionLitersPerKm: number
  truckPurchaseCostUsd: number
  truckUsefulLifeYears: number
  driverCostPerTruckPerYearUsd: number
  maintenancePerTruckPerYearUsd: number
  insurancePerTruckPerYearUsd: number
  tyreCostPerTruckPerYearUsd: number
  licensingAndPermitsPerTruckPerYearUsd: number
  adminOverheadUsdPerYear: number
  taxRatePercent: number
  debtSharePercent: number
  costOfDebtPercent: number
  targetEquityReturnPercent: number
}

export type EngineControlsInput = {
  monteCarloIterations: number
  sensitivityMode: "off" | "local" | "global"
  stressCase: "none" | "downside" | "upside"
}

export type EngineFinancePolicyInput = {
  corridorWideDiscountRatePercent: number
  terminalGrowthRatePercent: number
  exitMultiple: number
  dscrMinimum: number
  dscrLockupThreshold: number
  dscrDistributionThreshold: number
  debtServiceReserveMonths: number
  maintenanceReservePercentCapex: number
  cashSweepTriggerDscr: number
  contingencyPercentCapex: number
  developmentCostPercentCapex: number
}

export type EnginePresentationInput = {
  locale: string
  currency: string
}

/** Stable engine boundary input */
export type EngineInput = {
  version: typeof ENGINE_INPUT_VERSION
  horizon: EngineHorizon
  platform: EnginePlatformInput
  energy: EngineEnergyInput
  fleet: EngineFleetInput
  controls: EngineControlsInput
  financePolicy: EngineFinancePolicyInput
  presentation: EnginePresentationInput
  snapshotModel: SnapshotModelParameters
  /** Infrastructure scaling table (persisted in the ECIS store). */
  scalingBands: readonly ScalingBandRow[]
}

export type EnginePeriodPoint = {
  periodIndex: number
  /** Undiscounted placeholder operating margin for charts (not a persisted output) */
  placeholderNetCash: number
}

export type EngineProjectionResult =
  | {
      status: "ok"
      periods: readonly EnginePeriodPoint[]
      /** NPV of placeholder cash path at `horizon.discountRatePerPeriod` */
      headlineNpv: number
      /** Phase 5 ordered snapshot pipeline */
      scenario: ScenarioSnapshotOutput
      /** Phase 6 multi-entity projection (omitted if the model runner throws) */
      model?: ModelRunOutput
    }
  | { status: "failed"; error: string }

export type EngineSnapshotBlock =
  | { status: "ok"; capturedAt: string; label: string }
  | { status: "failed"; error: string }

/** Normalized engine output — always returned when run completes (partial failures inside facets). */
export type EngineOutput = {
  version: typeof ENGINE_OUTPUT_VERSION
  computedAt: string
  projection: EngineProjectionResult
  engineSnapshot: EngineSnapshotBlock
}

export type RunEngineFn = (input: EngineInput) => EngineOutput
