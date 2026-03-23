import type { ModelEntityId } from "@/model/types"

export const PAGE_VM_VERSION = 1 as const

export type DashboardAlertStrip = {
  showStaleHint: boolean
  resultsError: string | null
  projectionError: string | null
}

export type DashboardWarningBanner = {
  severity: "info" | "warn"
  code: string
  stage: string
  title: string
  message: string
  explanation: string | null
  actions: readonly string[]
}

export type DashboardConstraintBanner = {
  binding: boolean
  code: string
  title: string
  message: string
  shortfall?: number
  explanation: string | null
  actions: readonly string[]
}

export type DashboardConvergenceBadge = {
  status: "idle" | "stale" | "error" | "projection_only" | "ok"
  label: string
  detail: string | null
}

export type DashboardPriceStackSegment = {
  key: string
  label: string
  /** Display-currency / kWh for chart magnitude */
  displayPerKwh: number
  /** Engine USD/kWh (tooltip / export) */
  usdPerKwh: number
}

export type DashboardPriceStack = {
  available: boolean
  totalDisplayPerKwh: number
  segments: readonly DashboardPriceStackSegment[]
}

export type DashboardSummaryCard = {
  id: string
  title: string
  lines: readonly { label: string; value: string }[]
}

export type DashboardEntityQuickSummary = {
  entityId: ModelEntityId
  title: string
  lines: readonly { label: string; value: string }[]
  /** Highlight card when scenario issues touch this slice */
  highlight: boolean
}

export type DashboardFundingCapacity = {
  available: boolean
  minDscr: number | null
  llcr: number | null
  plcr: number | null
  chargingHeadroomKwh: number | null
  swapHeadroom: number | null
  totalCapex: { display: number; usd: number } | null
}

export type DashboardViewModel = {
  version: typeof PAGE_VM_VERSION
  resultsStatus: "idle" | "stale" | "ready"
  lastError: string | null
  corridorName: string
  modelHorizonYears: number
  vehicleCount: number
  recomputeRevision: number | null
  lastRunAt: number | null
  snapshotLabel: string | null
  snapshotStatus: "none" | "ok" | "failed"
  alerts: DashboardAlertStrip
  convergence: DashboardConvergenceBadge
  warningBanners: readonly DashboardWarningBanner[]
  constraintBanners: readonly DashboardConstraintBanner[]
  headline: {
    available: boolean
    headlineNpv: { display: number; usd: number } | null
    viable: boolean | null
    viabilityReasons: readonly string[]
  }
  priceStack: DashboardPriceStack
  chart: {
    available: boolean
    periods: readonly { periodIndex: number; placeholderNetCash: { display: number; usd: number } }[]
  }
  model: {
    available: boolean
    periodCount: number | null
    consolidatedLastNetIncome: { display: number; usd: number } | null
    unleveredNpv: { display: number; usd: number } | null
    equityNpv: { display: number; usd: number } | null
  }
  corridorSummaryCards: readonly DashboardSummaryCard[]
  entityQuickSummaries: readonly DashboardEntityQuickSummary[]
  fundingCapacity: DashboardFundingCapacity
}

export type EntityTableRowKind = "normal" | "memo" | "subtotal"

/** Column-aligned financial / schedule table (export-ready via semantic HTML). */
export type EntityDocumentTable = {
  id: string
  title: string
  caption?: string
  columns: readonly string[]
  rows: readonly {
    rowKey: string
    label: string
    rowKind?: EntityTableRowKind
    values: readonly string[]
  }[]
}

export type EntityKpiItem = {
  id: string
  label: string
  value: string
}

export type EntityCorridorMetricLine = {
  label: string
  value: string
}

export type EntityCorridorMetricsBlock = {
  available: boolean
  title: string
  lines: readonly EntityCorridorMetricLine[]
}

export type EntityWarningItem = {
  severity: "info" | "warn"
  code: string
  stage: string
  title: string
  message: string
  explanation: string | null
  actions: readonly string[]
}

export type EntityConstraintItem = {
  binding: boolean
  code: string
  title: string
  message: string
  explanation: string | null
  actions: readonly string[]
}

export type EntityChartBlock = {
  available: boolean
  chartKind: "line" | "stacked_bar"
  title: string
  categories: readonly string[]
  series: readonly {
    seriesKey: string
    label: string
    values: readonly number[]
  }[]
}

export type EntityPageViewModel = {
  version: typeof PAGE_VM_VERSION
  entityId: ModelEntityId
  title: string
  corridorName: string
  scenario: {
    available: boolean
    dailyEnergyDemandKwh: number | null
    dailySwapDemand: number | null
    totalRetailUsdPerKwh: number | null
    annualRevenueUsd: { display: number; usd: number } | null
    annualNetCashUsd: { display: number; usd: number } | null
  }
  projection: {
    available: boolean
    lastYearNetIncome: { display: number; usd: number } | null
    lastYearRevenue: { display: number; usd: number } | null
  }
  warningsCount: number
  constraintsBindingCount: number
  /** Model pack present with at least one statement row */
  dataAvailable: boolean
  kpis: readonly EntityKpiItem[]
  incomeStatement: EntityDocumentTable
  balanceSheet: EntityDocumentTable
  cashFlowStatement: EntityDocumentTable
  equityStatement: EntityDocumentTable
  debtSchedule: EntityDocumentTable
  capexSchedule: EntityDocumentTable
  sourcesUsesSchedule: EntityDocumentTable
  corridorMetrics: EntityCorridorMetricsBlock
  primaryChart: EntityChartBlock
  entityWarnings: readonly EntityWarningItem[]
  constraintItems: readonly EntityConstraintItem[]
}

/** Diesel retail energy-equivalent benchmark for corridor parity (USD/kWh); selector-only. */
export type ConsolidatedDieselParity = {
  available: boolean
  benchmarkUsdPerKwh: number
  benchmarkLabel: string
  a2RetailUsdPerKwh: number | null
  a2RetailDisplayPerKwh: number | null
  benchmarkDisplayPerKwh: number
  crossover:
    | "a2_below_diesel"
    | "at_par"
    | "a2_above_diesel"
    | "unknown"
  summaryLine: string
}

export type ConsolidatedConvergenceCheck = {
  id: string
  label: string
  ok: boolean
}

/** Intercompany / consolidation algebra — not business case viability. */
export type ConsolidatedCircularConvergence = {
  status: "ok" | "not_applicable" | "failed_check"
  label: string
  detail: string | null
  checks: readonly ConsolidatedConvergenceCheck[]
}

/** Snapshot pipeline viability (operational / economic), separate from circular convergence. */
export type ConsolidatedBusinessViability = {
  available: boolean
  viable: boolean | null
  reasons: readonly string[]
}

export type ConsolidatedEconomicsLine = {
  label: string
  value: string
  note?: string
}

export type ConsolidatedFundingTimelineRow = {
  rowKey: string
  period: string
  equity: string
  debt: string
  totalSources: string
  totalUses: string
  sumCategoryUses: string
  categoriesMatchUses: boolean
}

export type ConsolidatedFundingTimeline = {
  available: boolean
  rows: readonly ConsolidatedFundingTimelineRow[]
}

export type ConsolidatedPageViewModel = {
  version: typeof PAGE_VM_VERSION
  corridorName: string
  model: {
    available: boolean
    periodCount: number | null
    lastYear: {
      revenue: { display: number; usd: number } | null
      netIncome: { display: number; usd: number } | null
      totalAssets: { display: number; usd: number } | null
    }
    returnMetrics: {
      unleveredNpv: { display: number; usd: number } | null
      equityNpv: { display: number; usd: number } | null
      unleveredIrr: number | null
      equityIrr: number | null
      moicUnlevered: number | null
      moicEquity: number | null
    }
    coverage: {
      minDscr: number | null
      llcr: number | null
      plcr: number | null
    }
    eliminationsPerYear: number | null
  }
  priceStack: DashboardPriceStack
  dieselParity: ConsolidatedDieselParity
  economicsSummary: { lines: readonly ConsolidatedEconomicsLine[] }
  circularConvergence: ConsolidatedCircularConvergence
  businessViability: ConsolidatedBusinessViability
  investmentSummary: EntityDocumentTable
  sourcesUses: EntityDocumentTable
  fundingTimeline: ConsolidatedFundingTimeline
}

export type ScenarioRowViewModel = {
  id: string
  name: string
  createdAt: string
  isActive: boolean
}

export type ScenariosPageViewModel = {
  version: typeof PAGE_VM_VERSION
  activeScenarioId: string | null
  /** Ids selected for side-by-side comparison (persisted on workspace). */
  comparisonScenarioIds: readonly string[]
  rows: readonly ScenarioRowViewModel[]
}

export type ScenarioComparisonColumnHeader = {
  id: string
  label: string
  kind: "live" | "named"
}

export type ScenarioComparisonCell = {
  value: string
  deltaAbsolute: string | null
  deltaPercent: string | null
  highlight: "none" | "best"
}

export type ScenarioComparisonRow = {
  metricId: string
  metricLabel: string
  cells: readonly ScenarioComparisonCell[]
}

export type ScenarioComparisonViewModel = {
  version: typeof PAGE_VM_VERSION
  columns: readonly ScenarioComparisonColumnHeader[]
  rows: readonly ScenarioComparisonRow[]
  /** Shown when no named scenarios are selected for compare (live column only). */
  emptyComparisonHint: string | null
  enginePathNote: string
}

export type ExportsPageViewModel = {
  version: typeof PAGE_VM_VERSION
  currencyCode: string
  usedUsdFallback: boolean
  assumptionCsvRowCount: number
  namedScenarioCount: number
  hasReadyResults: boolean
  hasModelAnalytics: boolean
  availableEntityPackCount: number
  consolidatedPeriodCount: number | null
  exportJsonVersion: number
}

export type SensitivitiesTornadoRowVm = {
  driverId: string
  label: string
  impactDisplay: string
  baseDisplay: string
  lowDisplay: string
  highDisplay: string
}

export type SensitivitiesTwoWayVm = {
  rowAxisLabel: string
  colAxisLabel: string
  colHeaders: readonly string[]
  rows: readonly { rowLabel: string; cells: readonly string[] }[]
}

export type SensitivitiesBreakevenRowVm = {
  label: string
  statusLabel: string
  summary: string
}

export type SensitivitiesPageViewModel = {
  version: typeof PAGE_VM_VERSION
  sensitivityMode: "off" | "local" | "global"
  stressCase: "none" | "downside" | "upside"
  monteCarloIterations: number
  stressGridAvailable: boolean
  summary: string
  runPhase: "idle" | "running" | "ready" | "degraded"
  staleVersusRecompute: boolean
  enginePathNote: string
  tornado: readonly SensitivitiesTornadoRowVm[]
  twoWay: SensitivitiesTwoWayVm | null
  breakeven: readonly SensitivitiesBreakevenRowVm[]
  warnings: readonly string[]
}
