import type { ExportJsonOptions } from "@/export/json/exportJsonOptions"
import type { EngineOutput } from "@/engine/types"
import type { SnapshotModelParameters } from "@/snapshot/parameters"
import type { ScalingBandRow } from "@/snapshot/scalingBands"

export type SnapshotModelState = SnapshotModelParameters

export type AnnualTruckPlanRow = {
  yearIndex: number
  truckCount: number
}

export type SettingsState = {
  locale: string
  numberFormat: "standard" | "compact"
  currency: string
  fiscalYearStartMonth: number
  showDiagnostics: boolean
  /** USD per 1 unit of display currency (selectors / display layer). */
  displayFxUsdPerUnit: number
  baseCalculationCurrency: string
  exchangeRateEtbPerUsd: number
  exchangeRateDjfPerUsd: number
  exchangeRateEurPerUsd: number
  exchangeRateCnyPerUsd: number
  customCurrencyCode: string
  customCurrencyName: string
  customCurrencyPerUsd: number
}

export type SystemAssumptions = {
  modelHorizonYears: number
  discountRatePercent: number
  inflationAssumptionPercent: number
  terminalGrowthRatePercent: number
  exitMultiple: number
  corridorWideDiscountRatePercent: number
  dscrMinimum: number
  dscrLockupThreshold: number
  dscrDistributionThreshold: number
  debtServiceReserveMonths: number
  maintenanceReservePercentCapex: number
  cashSweepTriggerDscr: number
  contingencyPercentCapex: number
  developmentCostPercentCapex: number
  sharedPasscode: string
  notes: string
}

export type PlatformAssumptions = {
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

export type EnergyAssumptions = {
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

export type FleetAssumptions = {
  vehicleCount: number
  utilizationPercent: number
  averageDutyCycleHours: number
  annualTruckPlan: AnnualTruckPlanRow[]
  freightRatePerTonKmUsd: number
  averagePayloadTons: number
  tripsPerTruckPerDay: number
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

export type ControlsState = {
  monteCarloIterations: number
  sensitivityMode: "off" | "local" | "global"
  stressCase: "none" | "downside" | "upside"
}

export type WorkspacePanelsState = {
  assumptionsOpen: boolean
  diagnosticsOpen: boolean
}

export type WorkspaceState = {
  activePage: string
  panels: WorkspacePanelsState
  activeScenarioId: string | null
  comparisonScenarioIds: readonly string[]
}

export type AssumptionsSnapshot = {
  system: SystemAssumptions
  platform: PlatformAssumptions
  energy: EnergyAssumptions
  fleet: FleetAssumptions
  controls: ControlsState
  snapshotModel?: SnapshotModelState
  settings?: Partial<SettingsState>
  scalingBands?: ScalingBandRow[]
}

export type NamedScenario = {
  id: string
  name: string
  createdAt: string
  assumptions: AssumptionsSnapshot
}

export type ScenariosState = {
  named: Record<string, NamedScenario>
}

export type ResultsState = {
  status: "idle" | "stale" | "ready"
  lastError: string | null
  engineOutput: EngineOutput | null
}

export type SnapshotState = {
  capturedAt: string
  label?: string
  status?: "ok" | "failed"
  error?: string
} | null

export type RecomputeMeta = {
  lastRunAt: number | null
  revision: number
}

export type SensitivityTornadoBarState = {
  driverId: string
  label: string
  baseEquityNpv: number | null
  lowEquityNpv: number | null
  highEquityNpv: number | null
  impactMagnitude: number
}

export type SensitivityTwoWayState = {
  rowParamId: string
  rowParamLabel: string
  colParamId: string
  colParamLabel: string
  colLabels: readonly string[]
  rowLabels: readonly string[]
  cells: readonly (readonly (number | null)[])[]
}

export type SensitivityBreakevenLineState = {
  id: string
  label: string
  status: "ok" | "not_found" | "skipped"
  summary: string
}

export type SensitivityRunState = {
  phase: "idle" | "running" | "ready" | "degraded"
  updatedAt: number | null
  basedOnRecomputeRevision: number | null
  tornadoBars: readonly SensitivityTornadoBarState[]
  twoWay: SensitivityTwoWayState | null
  breakevenLines: readonly SensitivityBreakevenLineState[]
  warnings: readonly string[]
}

export type PersistedEcisSlice = {
  settings: SettingsState
  system: SystemAssumptions
  platform: PlatformAssumptions
  energy: EnergyAssumptions
  fleet: FleetAssumptions
  controls: ControlsState
  snapshotModel: SnapshotModelState
  scalingBands: ScalingBandRow[]
  workspace: WorkspaceState
  scenarios: Pick<ScenariosState, "named">
}

export type EcisDataState = {
  settings: SettingsState
  system: SystemAssumptions
  platform: PlatformAssumptions
  energy: EnergyAssumptions
  fleet: FleetAssumptions
  controls: ControlsState
  snapshotModel: SnapshotModelState
  scalingBands: ScalingBandRow[]
  workspace: WorkspaceState
  scenarios: ScenariosState
  results: ResultsState
  snapshot: SnapshotState
  recomputeMeta: RecomputeMeta
  sensitivityRun: SensitivityRunState
}

export type EcisActions = {
  updateSettings: (patch: Partial<SettingsState>) => void
  updateSystem: (patch: Partial<SystemAssumptions>) => void
  updatePlatform: (patch: Partial<PlatformAssumptions>) => void
  updateEnergy: (patch: Partial<EnergyAssumptions>) => void
  updateFleet: (patch: Partial<FleetAssumptions>) => void
  updateControls: (patch: Partial<ControlsState>) => void
  updateSnapshotModel: (patch: Partial<SnapshotModelState>) => void
  updateScalingBands: (bands: ScalingBandRow[]) => void
  loadScenario: (scenarioId: string) => void
  resetToDefaults: () => void
  setActivePage: (path: string) => void
  setPanelOpen: (panel: keyof WorkspacePanelsState, open: boolean) => void
  recompute: () => void
  saveNamedScenario: (name: string) => string
  loadNamedScenario: (id: string) => boolean
  deleteNamedScenario: (id: string) => void
  toggleComparisonScenario: (id: string) => void
  exportJson: (options?: ExportJsonOptions) => string
  exportCsv: () => string
  runSensitivityAnalysis: () => void
}

export type EcisStore = EcisDataState & EcisActions
