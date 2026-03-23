import { debtServiceCoverageSchedule } from "@/finance/dscr"
import { internalRateOfReturn } from "@/finance/irr"
import { loanLifeCoverageRatio } from "@/finance/llcr"
import { moicFromCashFlows } from "@/finance/moic"
import { netPresentValue } from "@/finance/npv"
import { paybackPeriods } from "@/finance/payback"
import { projectLifeCoverageRatio } from "@/finance/plcr"
import { reserveSchedule } from "@/finance/reserves"
import { weightedAverageCostOfCapital } from "@/finance/wacc"
import type {
  AnalyticsPack,
  AnnualBalanceSheet,
  AnnualCashFlowStatement,
  AnnualEquityStatement,
  AnnualIncomeStatement,
  CoverageMetrics,
  DcfSupportSeries,
  DistributionWaterfallLine,
  FundingGapLine,
  ReturnMetrics,
  ValuationMetrics,
} from "@/model/types"
import type { DebtScheduleRow } from "@/finance/debtSchedule"

type AnalyticsInput = {
  incomeStatement: readonly AnnualIncomeStatement[]
  balanceSheet: readonly AnnualBalanceSheet[]
  cashFlowStatement: readonly AnnualCashFlowStatement[]
  equityStatement: readonly AnnualEquityStatement[]
  debtSchedule: readonly DebtScheduleRow[]
  periodRate: number
  terminalGrowthRate: number
  exitMultiple: number
  costOfEquity: number
  costOfDebtPreTax: number
  taxRate: number
  maintenanceReservePercentCapex: number
  debtServiceReserveMonths: number
  dscrLockupThreshold: number
  dscrDistributionThreshold: number
  sinkingFundOnly?: boolean
}

function averageFinite(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite)
  if (finite.length === 0) return null
  return finite.reduce((sum, value) => sum + value, 0) / finite.length
}

function trailingEbitdaMultiple(
  incomeStatement: readonly AnnualIncomeStatement[],
  exitMultiple: number,
): number | null {
  const last = incomeStatement[incomeStatement.length - 1]
  if (!last || !Number.isFinite(last.ebitda)) return null
  return last.ebitda * exitMultiple
}

export function buildAnalyticsPack(input: AnalyticsInput): AnalyticsPack {
  const {
    incomeStatement,
    balanceSheet,
    cashFlowStatement,
    equityStatement,
    debtSchedule,
    periodRate,
    terminalGrowthRate,
    exitMultiple,
    costOfEquity,
    costOfDebtPreTax,
    taxRate,
    maintenanceReservePercentCapex,
    debtServiceReserveMonths,
    dscrLockupThreshold,
    dscrDistributionThreshold,
    sinkingFundOnly,
  } = input

  const cfads = incomeStatement.map((row) =>
    row.ebitda - row.taxExpense + row.depreciation,
  )
  const debtService = incomeStatement.map(
    (_, index) => debtSchedule[index]?.scheduledPayment ?? 0,
  )
  const dscrResult = debtServiceCoverageSchedule({
    cfadsByPeriod: cfads,
    debtServiceByPeriod: debtService,
  })

  let coverage: CoverageMetrics
  if ("error" in dscrResult) {
    coverage = {
      dscrByPeriod: [],
      minDscr: Number.NaN,
      avgDscr: null,
      llcr: null,
      plcr: null,
    }
  } else {
    const initialDebtOutstanding =
      (debtSchedule[0]?.beginningBalance ?? 0) + (debtSchedule[0]?.drawdown ?? 0)
    const ll = loanLifeCoverageRatio({
      cfadsByLoanPeriod: cfads.slice(0, debtSchedule.length),
      periodDiscountRate: periodRate,
      initialDebtOutstanding,
    })
    const pl = projectLifeCoverageRatio({
      cfadsByProjectPeriod: cfads,
      periodDiscountRate: periodRate,
      initialDebtOutstanding,
    })
    coverage = {
      dscrByPeriod: dscrResult.periods.map((row) => ({
        period: row.period,
        dscr: row.dscr,
        cfads: row.cfads,
        debtService: row.debtService,
      })),
      minDscr: dscrResult.minDscr,
      avgDscr: averageFinite(dscrResult.periods.map((row) => row.dscr)),
      llcr: ll.ok ? ll.llcr : null,
      plcr: pl.ok ? pl.plcr : null,
    }
  }

  const projectCashFlows = [
    0,
    ...cashFlowStatement.map(
      (row) => row.cashFromOperations + row.cashFromInvesting,
    ),
  ]
  const equityCashFlows = [
    0,
    ...cashFlowStatement.map(
      (row, index) =>
        row.cashFromOperations +
        row.cashFromInvesting +
        row.cashFromFinancing +
        (equityStatement[index]?.dividends ?? 0),
    ),
  ]
  const irrProject = internalRateOfReturn(projectCashFlows)
  const irrEquity = internalRateOfReturn(equityCashFlows)
  const npvProject = netPresentValue({
    periodRate,
    cashFlows: projectCashFlows,
  }).npv
  const npvEquity = netPresentValue({
    periodRate,
    cashFlows: equityCashFlows,
  }).npv

  const investedEquityByPeriod = equityStatement.map((row) => row.equityIssuance)
  let cumulativeInvestedEquity = 0
  const cashOnCashByPeriod = equityStatement.map((row, index) => {
    cumulativeInvestedEquity += Math.max(0, investedEquityByPeriod[index] ?? 0)
    const dividends = row.dividends
    return {
      periodIndex: row.periodIndex,
      value:
        cumulativeInvestedEquity > 0 ? dividends / cumulativeInvestedEquity : null,
    }
  })

  const returnMetrics: ReturnMetrics = {
    unleveredIrr: irrProject.ok ? irrProject.irr : null,
    equityIrr: irrEquity.ok ? irrEquity.irr : null,
    unleveredNpv: npvProject,
    equityNpv: npvEquity,
    moicUnlevered: moicFromCashFlows(projectCashFlows).moic,
    moicEquity: moicFromCashFlows(equityCashFlows).moic,
    cashOnCashByPeriod,
  }

  const payback = paybackPeriods({
    cashFlows: projectCashFlows,
    periodRate,
  })
  const paybackEquity = paybackPeriods({
    cashFlows: equityCashFlows,
    periodRate,
  })

  const dcfSupport: DcfSupportSeries[] = incomeStatement.map((row, index) => {
    const discountFactor = Math.pow(1 + periodRate, -row.periodIndex)
    const projectCf = projectCashFlows[index + 1] ?? 0
    const equityCfValue = equityCashFlows[index + 1] ?? 0
    return {
      periodIndex: row.periodIndex,
      unleveredFreeCashFlow: projectCf,
      leveredEquityCashFlow: equityCfValue,
      discountFactor,
      pvUnleveredFcf: projectCf * discountFactor,
      pvEquityCf: equityCfValue * discountFactor,
    }
  })

  const totalDebt = balanceSheet[balanceSheet.length - 1]?.debt ?? 0
  const totalEquity = balanceSheet[balanceSheet.length - 1]?.equity ?? 0
  const waccResult = weightedAverageCostOfCapital({
    marketValueEquity: Math.max(0, totalEquity),
    marketValueDebt: Math.max(0, totalDebt),
    costOfEquity,
    costOfDebtPreTax,
    taxRate,
  })
  const terminalValuePerpetuity = (() => {
    const lastProjectCf = projectCashFlows[projectCashFlows.length - 1] ?? 0
    const growth = terminalGrowthRate
    const discount = waccResult.ok ? waccResult.wacc : periodRate
    if (!Number.isFinite(lastProjectCf) || discount <= growth) return null
    return (lastProjectCf * (1 + growth)) / (discount - growth)
  })()
  const terminalValueExitMultiple = trailingEbitdaMultiple(
    incomeStatement,
    exitMultiple,
  )
  const enterpriseValue =
    dcfSupport.reduce((sum, row) => sum + row.pvUnleveredFcf, 0) +
    ((terminalValuePerpetuity ?? 0) *
      Math.pow(1 + (waccResult.ok ? waccResult.wacc : periodRate), -incomeStatement.length))
  const equityValue = enterpriseValue - totalDebt + (balanceSheet[balanceSheet.length - 1]?.cash ?? 0)

  const valuation: ValuationMetrics = {
    costOfEquity,
    costOfDebtPreTax,
    afterTaxCostOfDebt: waccResult.ok ? waccResult.afterTaxCostOfDebt : null,
    wacc: waccResult.ok ? waccResult.wacc : null,
    terminalGrowthRate,
    exitMultiple,
    terminalValuePerpetuity,
    terminalValueExitMultiple,
    enterpriseValue: Number.isFinite(enterpriseValue) ? enterpriseValue : null,
    equityValue: Number.isFinite(equityValue) ? equityValue : null,
  }

  const maintenanceContributions = cashFlowStatement.map((row) =>
    Math.max(0, -row.cashFromInvesting) * maintenanceReservePercentCapex,
  )
  const debtReserveContributions = debtService.map(
    (service) => service * (debtServiceReserveMonths / 12),
  )
  const sinkingContributions = cashFlowStatement.map((row) =>
    sinkingFundOnly ? row.sinkingFundContribution : 0,
  )
  const reserveResult = reserveSchedule({
    openingBalance: 0,
    contributionsByPeriod: maintenanceContributions.map(
      (value, index) => value + debtReserveContributions[index]! + sinkingContributions[index]!,
    ),
    releasesByPeriod: maintenanceContributions.map(() => 0),
    floorAtZero: true,
  })
  const reserveScheduleLines =
    reserveResult.ok
      ? reserveResult.periods.map((row, index) => ({
          periodIndex: index + 1,
          openingBalance: row.openingBalance,
          maintenanceReserveContribution: maintenanceContributions[index] ?? 0,
          debtServiceReserveContribution: debtReserveContributions[index] ?? 0,
          sinkingFundContribution: sinkingContributions[index] ?? 0,
          releases: row.releases,
          closingBalance: row.closingBalance,
        }))
      : []

  let cumulativeGap = 0
  const distributionWaterfall: DistributionWaterfallLine[] = incomeStatement.map(
    (row, index) => {
      const operatingExpenses = row.costOfGoodsSold + row.operatingExpenses + row.taxExpense
      const reserveContributions =
        (maintenanceContributions[index] ?? 0) +
        (debtReserveContributions[index] ?? 0)
      const debtServiceValue = debtService[index] ?? 0
      const cfAvailableBeforeDistribution =
        (cashFlowStatement[index]?.cashFromOperations ?? 0) -
        debtServiceValue -
        reserveContributions -
        (sinkingContributions[index] ?? 0)
      const dscrValue = coverage.dscrByPeriod[index]?.dscr ?? Number.NaN
      const locked =
        !Number.isFinite(dscrValue) || dscrValue < dscrLockupThreshold
      const dividendsPaid =
        locked || dscrValue < dscrDistributionThreshold
          ? 0
          : Math.max(0, cfAvailableBeforeDistribution)
      return {
        periodIndex: row.periodIndex,
        revenue: row.revenue,
        operatingExpenses,
        debtService: debtServiceValue,
        reserveContributions,
        sinkingFundContribution: sinkingContributions[index] ?? 0,
        cashAvailableForDistribution: cfAvailableBeforeDistribution,
        dividendsPaid,
        payoutRatio:
          row.netIncome > 0 ? dividendsPaid / row.netIncome : null,
        distributionLocked: locked,
      }
    },
  )

  const fundingGap: FundingGapLine[] = cashFlowStatement.map((row, index) => {
    const cashRequired =
      Math.max(0, -row.cashFromInvesting) +
      Math.max(0, -(row.cashFromFinancing ?? 0)) +
      (distributionWaterfall[index]?.reserveContributions ?? 0) +
      (distributionWaterfall[index]?.sinkingFundContribution ?? 0)
    const cashAvailable = Math.max(0, row.cashFromOperations) + Math.max(0, row.cashFromFinancing)
    const gap = Math.max(0, cashRequired - cashAvailable)
    cumulativeGap += gap
    return {
      periodIndex: row.periodIndex,
      cashRequired,
      cashAvailable,
      fundingGap: gap,
      cumulativeFundingGap: cumulativeGap,
    }
  })

  return {
    coverage,
    returnMetrics,
    dcfSupport,
    payback: {
      projectUndiscounted: payback.undiscountedPaybackPeriod,
      projectDiscounted: payback.discountedPaybackPeriod,
      equityUndiscounted: paybackEquity.undiscountedPaybackPeriod,
      equityDiscounted: paybackEquity.discountedPaybackPeriod,
    },
    valuation,
    reserveSchedule: reserveScheduleLines,
    distributionWaterfall,
    fundingGap,
  }
}
