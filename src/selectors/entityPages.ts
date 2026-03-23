import { convertUsdForDisplay } from "@/selectors/convert"
import { composeEntityPageDetail } from "@/selectors/entityPageDetail"
import type { SelectorDisplayContext } from "@/selectors/context"
import { getOkProjection } from "@/selectors/input"
import type { EcisSelectorInput } from "@/selectors/input"
import type { EntityPageViewModel } from "@/selectors/types"
import { PAGE_VM_VERSION } from "@/selectors/types"
import type { ModelEntityId } from "@/model/types"

const TITLES: Record<ModelEntityId, string> = {
  energy: "A2 Energy",
  platform: "A2 Platform",
  fleet: "Fleet",
}

export function selectEntityPageViewModel(
  entityId: ModelEntityId,
  input: EcisSelectorInput,
  ctx: SelectorDisplayContext,
): EntityPageViewModel {
  const proj = getOkProjection(input.results.engineOutput)
  const scenario = proj?.scenario.pipeline
  const model = proj?.model
  const pack = model?.entities[entityId]
  const lastIs =
    pack && pack.incomeStatement.length > 0
      ? pack.incomeStatement[pack.incomeStatement.length - 1]!
      : null

  const warnings = proj?.scenario.warnings ?? []
  const constraints = proj?.scenario.constraints ?? []
  const binding = constraints.filter((c) => c.binding).length

  let annualRevenueUsd: ReturnType<typeof convertUsdForDisplay> | null = null
  let annualNetCashUsd: ReturnType<typeof convertUsdForDisplay> | null = null
  let dailyEnergy: number | null = null
  let dailySwap: number | null = null
  let totalRetail: number | null = null

  if (scenario) {
    dailyEnergy = scenario.demand.dailyEnergyDemandKwh
    dailySwap = scenario.demand.dailySwapDemand
    totalRetail = scenario.pricing.totalRetailUsdPerKwh
    annualRevenueUsd = convertUsdForDisplay(
      scenario.entityFinancials.annualRevenueUsd,
      ctx,
    )
    annualNetCashUsd = convertUsdForDisplay(
      scenario.entityFinancials.annualNetCashUsd,
      ctx,
    )
  }

  const detail = composeEntityPageDetail(
    entityId,
    ctx,
    pack,
    model,
    {
      dailyEnergyDemandKwh: dailyEnergy,
      dailySwapDemand: dailySwap,
      totalRetailUsdPerKwh: totalRetail,
      annualRevenueUsd,
      annualNetCashUsd,
    },
    warnings,
    constraints,
    lastIs,
  )

  return {
    version: PAGE_VM_VERSION,
    entityId,
    title: TITLES[entityId],
    corridorName: input.platform.corridorName,
    scenario: {
      available: scenario !== undefined,
      dailyEnergyDemandKwh: dailyEnergy,
      dailySwapDemand: dailySwap,
      totalRetailUsdPerKwh: totalRetail,
      annualRevenueUsd,
      annualNetCashUsd,
    },
    projection: {
      available: lastIs !== null,
      lastYearNetIncome:
        lastIs !== null
          ? convertUsdForDisplay(lastIs.netIncome, ctx)
          : null,
      lastYearRevenue:
        lastIs !== null
          ? convertUsdForDisplay(lastIs.revenue, ctx)
          : null,
    },
    warningsCount: warnings.length,
    constraintsBindingCount: binding,
    dataAvailable: detail.dataAvailable,
    kpis: detail.kpis,
    incomeStatement: detail.incomeStatement,
    balanceSheet: detail.balanceSheet,
    cashFlowStatement: detail.cashFlowStatement,
    equityStatement: detail.equityStatement,
    debtSchedule: detail.debtSchedule,
    capexSchedule: detail.capexSchedule,
    sourcesUsesSchedule: detail.sourcesUsesSchedule,
    corridorMetrics: detail.corridorMetrics,
    primaryChart: detail.primaryChart,
    entityWarnings: detail.entityWarnings,
    constraintItems: detail.constraintItems,
  }
}
