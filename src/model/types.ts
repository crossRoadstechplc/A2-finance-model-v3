import type { DebtScheduleRow } from "@/finance/debtSchedule"

import type { ProjectionModelParameters } from "@/model/parameters"

export const MODEL_OUTPUT_VERSION = 1 as const

export type ModelEntityId = "energy" | "platform" | "fleet"

export type AnnualIncomeStatement = {
  periodIndex: number
  revenue: number
  costOfGoodsSold: number
  operatingExpenses: number
  ebitda: number
  depreciation: number
  ebit: number
  interestExpense: number
  pretaxIncome: number
  taxExpense: number
  netIncome: number
}

export type AnnualBalanceSheet = {
  periodIndex: number
  cash: number
  sinkingFundAsset: number
  ppeGross: number
  accumulatedDepreciation: number
  totalAssets: number
  debt: number
  totalLiabilities: number
  equity: number
  totalLiabilitiesAndEquity: number
}

export type AnnualCashFlowStatement = {
  periodIndex: number
  cashFromOperations: number
  cashFromInvesting: number
  cashFromFinancing: number
  sinkingFundContribution: number
  netChangeInCash: number
}

export type AnnualEquityStatement = {
  periodIndex: number
  beginningEquity: number
  equityIssuance: number
  netIncome: number
  dividends: number
  endingEquity: number
}

export type CapexDeploymentRow = {
  periodIndex: number
  energyInfrastructureUsd: number
  energyBatteryUsd: number
  platformUsd: number
  fleetTrucksUsd: number
  totalUsd: number
}

export type SourcesUsesRow = {
  periodIndex: number
  /** Equity and debt draws (positive = source) */
  equityContributionUsd: number
  debtDrawUsd: number
  totalSourcesUsd: number
  energyInfrastructureUsd: number
  energyBatteryUsd: number
  platformUsd: number
  fleetTrucksUsd: number
  totalUsesUsd: number
}

export type EliminationLine = {
  code: string
  periodIndex: number
  amountUsd: number
  description: string
}

export type ConsolidatedAnnualPack = {
  periodIndex: number
  incomeStatement: AnnualIncomeStatement
  balanceSheet: AnnualBalanceSheet
  cashFlowStatement: AnnualCashFlowStatement
  equityStatement: AnnualEquityStatement
}

export type CoverageMetrics = {
  dscrByPeriod: readonly { period: number; dscr: number; cfads: number; debtService: number }[]
  minDscr: number
  avgDscr: number | null
  llcr: number | null
  plcr: number | null
}

export type ReturnMetrics = {
  unleveredIrr: number | null
  equityIrr: number | null
  unleveredNpv: number
  equityNpv: number
  moicUnlevered: number
  moicEquity: number
  cashOnCashByPeriod: readonly { periodIndex: number; value: number | null }[]
}

export type DcfSupportSeries = {
  periodIndex: number
  unleveredFreeCashFlow: number
  leveredEquityCashFlow: number
  discountFactor: number
  pvUnleveredFcf: number
  pvEquityCf: number
}

export type PaybackMetrics = {
  projectUndiscounted: number | null
  projectDiscounted: number | null
  equityUndiscounted: number | null
  equityDiscounted: number | null
}

export type ValuationMetrics = {
  costOfEquity: number
  costOfDebtPreTax: number
  afterTaxCostOfDebt: number | null
  wacc: number | null
  terminalGrowthRate: number
  exitMultiple: number
  terminalValuePerpetuity: number | null
  terminalValueExitMultiple: number | null
  enterpriseValue: number | null
  equityValue: number | null
}

export type ReserveScheduleLine = {
  periodIndex: number
  openingBalance: number
  maintenanceReserveContribution: number
  debtServiceReserveContribution: number
  sinkingFundContribution: number
  releases: number
  closingBalance: number
}

export type DistributionWaterfallLine = {
  periodIndex: number
  revenue: number
  operatingExpenses: number
  debtService: number
  reserveContributions: number
  sinkingFundContribution: number
  cashAvailableForDistribution: number
  dividendsPaid: number
  payoutRatio: number | null
  distributionLocked: boolean
}

export type FundingGapLine = {
  periodIndex: number
  cashRequired: number
  cashAvailable: number
  fundingGap: number
  cumulativeFundingGap: number
}

export type AnalyticsPack = {
  coverage: CoverageMetrics
  returnMetrics: ReturnMetrics
  dcfSupport: readonly DcfSupportSeries[]
  payback: PaybackMetrics
  valuation: ValuationMetrics
  reserveSchedule: readonly ReserveScheduleLine[]
  distributionWaterfall: readonly DistributionWaterfallLine[]
  fundingGap: readonly FundingGapLine[]
}

export type EntityProjectionPack = {
  incomeStatement: readonly AnnualIncomeStatement[]
  balanceSheet: readonly AnnualBalanceSheet[]
  cashFlowStatement: readonly AnnualCashFlowStatement[]
  equityStatement: readonly AnnualEquityStatement[]
  capexDeployment: readonly CapexDeploymentRow[]
  debtSchedule: readonly DebtScheduleRow[]
  sourcesUses: readonly SourcesUsesRow[]
}

export type ModelRunOutput = {
  version: typeof MODEL_OUTPUT_VERSION
  /** Operating periods 1…N aligned with `EngineInput.horizon.periodCount` */
  periodCount: number
  parameters: ProjectionModelParameters
  /** Intercompany fees / corridor charges used in eliminations */
  platformIntercompanyUsdPerYear: number
  fleetCorridorChargeUsdPerYear: number
  entities: Record<ModelEntityId, EntityProjectionPack>
  eliminations: readonly EliminationLine[]
  consolidated: readonly ConsolidatedAnnualPack[]
  coverage: CoverageMetrics
  returnMetrics: ReturnMetrics
  dcfSupport: readonly DcfSupportSeries[]
  analytics: {
    corridor: AnalyticsPack
    entities: Record<ModelEntityId, AnalyticsPack>
  }
}
