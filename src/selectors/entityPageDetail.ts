import { convertUsdForDisplay, formatDisplayNumber } from "@/selectors/convert"
import type { SelectorDisplayContext } from "@/selectors/context"
import {
  toEntityConstraintItem,
  toEntityWarningItem,
} from "@/selectors/warningGuidance"
import type {
  EntityChartBlock,
  EntityConstraintItem,
  EntityCorridorMetricsBlock,
  EntityCorridorMetricLine,
  EntityDocumentTable,
  EntityKpiItem,
  EntityTableRowKind,
  EntityWarningItem,
} from "@/selectors/types"
import type {
  AnnualBalanceSheet,
  AnnualCashFlowStatement,
  AnnualEquityStatement,
  AnnualIncomeStatement,
  CapexDeploymentRow,
  EntityProjectionPack,
  ModelEntityId,
  ModelRunOutput,
  SourcesUsesRow,
} from "@/model/types"
import type { DebtScheduleRow } from "@/finance/debtSchedule"
import type {
  PipelineStageId,
  SnapshotConstraint,
  SnapshotWarning,
} from "@/snapshot/types"

const ENTITY_WARNING_STAGES: Record<ModelEntityId, readonly PipelineStageId[]> = {
  energy: ["pricing", "entityFinancials", "capex", "constraints"],
  platform: ["capex", "viability", "entityFinancials", "infrastructure"],
  fleet: ["demand", "constraints", "infrastructure", "viability"],
}

function money(ctx: SelectorDisplayContext, usd: number): string {
  if (!Number.isFinite(usd)) return "—"
  const d = convertUsdForDisplay(usd, ctx)
  return `${formatDisplayNumber(d.display, ctx)} ${ctx.currencyCode}`
}

function fmtIrr(ctx: SelectorDisplayContext, irr: number | null): string {
  if (irr === null || !Number.isFinite(irr)) return "—"
  return new Intl.NumberFormat(ctx.locale, {
    style: "percent",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(irr)
}

function fmtMoic(ctx: SelectorDisplayContext, m: number): string {
  if (!Number.isFinite(m)) return "—"
  return `${formatDisplayNumber(m, ctx)}×`
}

function fmtRatio(ctx: SelectorDisplayContext, x: number): string {
  if (!Number.isFinite(x)) return "—"
  return new Intl.NumberFormat(ctx.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(x)
}

function emptyTable(
  id: string,
  title: string,
  caption?: string,
): EntityDocumentTable {
  return { id, title, caption, columns: [], rows: [] }
}

function buildIncomeStatement(
  ctx: SelectorDisplayContext,
  rows: readonly AnnualIncomeStatement[],
): EntityDocumentTable {
  if (rows.length === 0) {
    return emptyTable("is", "Income statement")
  }
  const columns = rows.map((r) => `Y${r.periodIndex}`)
  const defs: {
    key: string
    label: string
    rowKind?: EntityTableRowKind
    pick: (r: AnnualIncomeStatement) => number
  }[] = [
    { key: "rev", label: "Revenue", pick: (r) => r.revenue },
    { key: "cogs", label: "Cost of goods sold", pick: (r) => r.costOfGoodsSold },
    { key: "opex", label: "Operating expenses", pick: (r) => r.operatingExpenses },
    {
      key: "ebitda",
      label: "EBITDA",
      rowKind: "subtotal",
      pick: (r) => r.ebitda,
    },
    { key: "depr", label: "Depreciation", pick: (r) => r.depreciation },
    { key: "ebit", label: "EBIT", pick: (r) => r.ebit },
    { key: "int", label: "Interest expense", pick: (r) => r.interestExpense },
    { key: "pretax", label: "Pretax income", pick: (r) => r.pretaxIncome },
    { key: "tax", label: "Tax expense", pick: (r) => r.taxExpense },
    {
      key: "ni",
      label: "Net income",
      rowKind: "subtotal",
      pick: (r) => r.netIncome,
    },
  ]
  return {
    id: "income",
    title: "Income statement",
    caption: "Entity annual income statement (display currency).",
    columns,
    rows: defs.map((d) => ({
      rowKey: d.key,
      label: d.label,
      rowKind: d.rowKind,
      values: rows.map((r) => money(ctx, d.pick(r))),
    })),
  }
}

function buildBalanceSheet(
  ctx: SelectorDisplayContext,
  rows: readonly AnnualBalanceSheet[],
): EntityDocumentTable {
  if (rows.length === 0) return emptyTable("bs", "Balance sheet")
  const columns = rows.map((r) => `Y${r.periodIndex}`)
  const defs: {
    key: string
    label: string
    rowKind?: EntityTableRowKind
    pick: (r: AnnualBalanceSheet) => number
  }[] = [
    { key: "cash", label: "Cash", pick: (r) => r.cash },
    {
      key: "sink_asset",
      label: "Sinking fund asset (reserve)",
      rowKind: "memo",
      pick: (r) => r.sinkingFundAsset,
    },
    { key: "ppe", label: "PPE gross", pick: (r) => r.ppeGross },
    { key: "ad", label: "Accumulated depreciation", pick: (r) => r.accumulatedDepreciation },
    {
      key: "ta",
      label: "Total assets",
      rowKind: "subtotal",
      pick: (r) => r.totalAssets,
    },
    { key: "debt", label: "Debt", pick: (r) => r.debt },
    {
      key: "tl",
      label: "Total liabilities",
      rowKind: "subtotal",
      pick: (r) => r.totalLiabilities,
    },
    { key: "eq", label: "Equity", pick: (r) => r.equity },
    {
      key: "tle",
      label: "Total liabilities & equity",
      rowKind: "subtotal",
      pick: (r) => r.totalLiabilitiesAndEquity,
    },
  ]
  return {
    id: "balance",
    title: "Balance sheet",
    caption: "Reserve / memo line: sinking fund asset.",
    columns,
    rows: defs.map((d) => ({
      rowKey: d.key,
      label: d.label,
      rowKind: d.rowKind,
      values: rows.map((r) => money(ctx, d.pick(r))),
    })),
  }
}

function buildCashFlow(
  ctx: SelectorDisplayContext,
  rows: readonly AnnualCashFlowStatement[],
): EntityDocumentTable {
  if (rows.length === 0) return emptyTable("cf", "Cash flow statement")
  const columns = rows.map((r) => `Y${r.periodIndex}`)
  const defs: {
    key: string
    label: string
    rowKind?: EntityTableRowKind
    pick: (r: AnnualCashFlowStatement) => number
  }[] = [
    { key: "cfo", label: "Cash from operations", pick: (r) => r.cashFromOperations },
    { key: "cfi", label: "Cash from investing", pick: (r) => r.cashFromInvesting },
    { key: "cff", label: "Cash from financing", pick: (r) => r.cashFromFinancing },
    {
      key: "sink_cf",
      label: "Sinking fund contribution (memo)",
      rowKind: "memo",
      pick: (r) => r.sinkingFundContribution,
    },
    {
      key: "net",
      label: "Net change in cash",
      rowKind: "subtotal",
      pick: (r) => r.netChangeInCash,
    },
  ]
  return {
    id: "cashflow",
    title: "Cash flow statement",
    caption: "Memo line: sinking fund contribution.",
    columns,
    rows: defs.map((d) => ({
      rowKey: d.key,
      label: d.label,
      rowKind: d.rowKind,
      values: rows.map((r) => money(ctx, d.pick(r))),
    })),
  }
}

function buildEquityStatement(
  ctx: SelectorDisplayContext,
  rows: readonly AnnualEquityStatement[],
): EntityDocumentTable {
  if (rows.length === 0) return emptyTable("eq", "Statement of equity")
  const columns = rows.map((r) => `Y${r.periodIndex}`)
  const defs: {
    key: string
    label: string
    rowKind?: EntityTableRowKind
    pick: (r: AnnualEquityStatement) => number
  }[] = [
    { key: "beg", label: "Beginning equity", pick: (r) => r.beginningEquity },
    { key: "iss", label: "Equity issuance", pick: (r) => r.equityIssuance },
    { key: "ni", label: "Net income", pick: (r) => r.netIncome },
    { key: "div", label: "Dividends", pick: (r) => r.dividends },
    {
      key: "end",
      label: "Ending equity",
      rowKind: "subtotal",
      pick: (r) => r.endingEquity,
    },
  ]
  return {
    id: "equity",
    title: "Statement of equity",
    columns,
    rows: defs.map((d) => ({
      rowKey: d.key,
      label: d.label,
      rowKind: d.rowKind,
      values: rows.map((r) => money(ctx, d.pick(r))),
    })),
  }
}

function buildDebtSchedule(
  ctx: SelectorDisplayContext,
  rows: readonly DebtScheduleRow[],
): EntityDocumentTable {
  if (rows.length === 0) {
    return {
      ...emptyTable("debt", "Debt schedule"),
      caption: "Entity debt amortization schedule.",
    }
  }
  const hasDrawdowns = rows.some((row) => (row.drawdown ?? 0) !== 0)
  const columns = [
    "Beginning balance",
    ...(hasDrawdowns ? ["Drawdown"] : []),
    "Scheduled payment",
    "Interest",
    "Principal",
    "Ending balance",
  ]
  return {
    id: "debt",
    title: "Debt schedule",
    caption: "Entity-level debt schedule.",
    columns,
    rows: rows.map((dr) => ({
      rowKey: `debt-p${dr.period}`,
      label: `Period ${dr.period}`,
      values: [
        money(ctx, dr.beginningBalance),
        ...(hasDrawdowns ? [money(ctx, dr.drawdown ?? 0)] : []),
        money(ctx, dr.scheduledPayment),
        money(ctx, dr.interestPortion),
        money(ctx, dr.principalPortion),
        money(ctx, dr.endingBalance),
      ],
    })),
  }
}

function buildCapexSchedule(
  ctx: SelectorDisplayContext,
  rows: readonly CapexDeploymentRow[],
): EntityDocumentTable {
  if (rows.length === 0) {
    return {
      ...emptyTable("capex", "Capex deployment"),
      caption: "Entity capex by period and category.",
    }
  }
  const columns = [
    "Energy infrastructure",
    "Energy battery",
    "Platform",
    "Fleet trucks",
    "Total",
  ]
  return {
    id: "capex",
    title: "Capex deployment",
    caption: "Entity-level capex deployment.",
    columns,
    rows: rows.map((r) => ({
      rowKey: `capex-y${r.periodIndex}`,
      label: `Y${r.periodIndex}`,
      values: [
        money(ctx, r.energyInfrastructureUsd),
        money(ctx, r.energyBatteryUsd),
        money(ctx, r.platformUsd),
        money(ctx, r.fleetTrucksUsd),
        money(ctx, r.totalUsd),
      ],
    })),
  }
}

function buildSourcesUses(
  ctx: SelectorDisplayContext,
  rows: readonly SourcesUsesRow[],
): EntityDocumentTable {
  if (rows.length === 0) {
    return {
      ...emptyTable("su", "Sources & uses"),
      caption: "Entity funding vs spend by period.",
    }
  }
  const columns = [
    "Equity",
    "Debt draw",
    "Total sources",
    "Energy infra",
    "Energy battery",
    "Platform",
    "Fleet",
    "Total uses",
  ]
  return {
    id: "sources_uses",
    title: "Sources & uses",
    caption: "Entity equity and debt sources against entity uses.",
    columns,
    rows: rows.map((r) => ({
      rowKey: `su-y${r.periodIndex}`,
      label: `Y${r.periodIndex}`,
      values: [
        money(ctx, r.equityContributionUsd),
        money(ctx, r.debtDrawUsd),
        money(ctx, r.totalSourcesUsd),
        money(ctx, r.energyInfrastructureUsd),
        money(ctx, r.energyBatteryUsd),
        money(ctx, r.platformUsd),
        money(ctx, r.fleetTrucksUsd),
        money(ctx, r.totalUsesUsd),
      ],
    })),
  }
}

function buildCorridorMetrics(
  entityId: ModelEntityId,
  model: ModelRunOutput | undefined,
  ctx: SelectorDisplayContext,
): EntityCorridorMetricsBlock {
  const analytics = model?.analytics.entities[entityId]
  if (!analytics) {
    return {
      available: false,
      title: "Entity return & coverage",
      lines: [],
    }
  }
  const rm = analytics.returnMetrics
  const cov = analytics.coverage
  const valuation = analytics.valuation
  const payback = analytics.payback
  const lines: EntityCorridorMetricLine[] = [
    { label: "Unlevered IRR", value: fmtIrr(ctx, rm.unleveredIrr) },
    { label: "Equity IRR", value: fmtIrr(ctx, rm.equityIrr) },
    { label: "Unlevered NPV", value: money(ctx, rm.unleveredNpv) },
    { label: "Equity NPV", value: money(ctx, rm.equityNpv) },
    { label: "MOIC (unlevered)", value: fmtMoic(ctx, rm.moicUnlevered) },
    { label: "MOIC (equity)", value: fmtMoic(ctx, rm.moicEquity) },
    {
      label: "WACC",
      value:
        valuation.wacc !== null && Number.isFinite(valuation.wacc)
          ? fmtIrr(ctx, valuation.wacc)
          : "â€”",
    },
    {
      label: "Project payback",
      value:
        payback.projectUndiscounted !== null
          ? `${formatDisplayNumber(payback.projectUndiscounted, ctx)} yrs`
          : "â€”",
    },
    {
      label: "Min DSCR",
      value: Number.isFinite(cov.minDscr) ? fmtRatio(ctx, cov.minDscr) : "—",
    },
    {
      label: "Avg DSCR",
      value:
        cov.avgDscr !== null && Number.isFinite(cov.avgDscr)
          ? fmtRatio(ctx, cov.avgDscr)
          : "â€”",
    },
    {
      label: "LLCR",
      value:
        cov.llcr !== null && Number.isFinite(cov.llcr)
          ? fmtRatio(ctx, cov.llcr)
          : "—",
    },
    {
      label: "PLCR",
      value:
        cov.plcr !== null && Number.isFinite(cov.plcr)
          ? fmtRatio(ctx, cov.plcr)
          : "—",
    },
  ]
  return {
    available: true,
    title: "Entity return & coverage",
    lines,
  }
}

function buildPrimaryChart(
  entityId: ModelEntityId,
  pack: EntityProjectionPack | undefined,
  ctx: SelectorDisplayContext,
): EntityChartBlock {
  if (!pack || pack.incomeStatement.length === 0) {
    return {
      available: false,
      chartKind: "line",
      title: "",
      categories: [],
      series: [],
    }
  }

  const is = pack.incomeStatement
  const categories = is.map((r) => `Y${r.periodIndex}`)

  if (entityId === "platform") {
    const capex = pack.capexDeployment
    if (capex.length === 0) {
      return {
        available: false,
        chartKind: "stacked_bar",
        title: "",
        categories: [],
        series: [],
      }
    }
    const cats = capex.map((r) => `Y${r.periodIndex}`)
    const toDisp = (usd: number) =>
      Number.isFinite(usd) ? convertUsdForDisplay(usd, ctx).display : 0
    return {
      available: true,
      chartKind: "stacked_bar",
      title: "Capex deployment by category (corridor)",
      categories: cats,
      series: [
        {
          seriesKey: "e_infra",
          label: "Energy infrastructure",
          values: capex.map((r) => toDisp(r.energyInfrastructureUsd)),
        },
        {
          seriesKey: "e_batt",
          label: "Energy battery",
          values: capex.map((r) => toDisp(r.energyBatteryUsd)),
        },
        {
          seriesKey: "plat",
          label: "Platform",
          values: capex.map((r) => toDisp(r.platformUsd)),
        },
        {
          seriesKey: "fleet_cx",
          label: "Fleet trucks",
          values: capex.map((r) => toDisp(r.fleetTrucksUsd)),
        },
      ],
    }
  }

  if (entityId === "fleet") {
    const capex = pack.capexDeployment
    const toDisp = (usd: number) =>
      Number.isFinite(usd) ? convertUsdForDisplay(usd, ctx).display : 0
    const rev = is.map((r) => toDisp(r.revenue))
    const ni = is.map((r) => toDisp(r.netIncome))
    const cxByPeriod = new Map(capex.map((r) => [r.periodIndex, r]))
    const fleetCx = is.map((r) => {
      const row = cxByPeriod.get(r.periodIndex)
      return row ? toDisp(row.fleetTrucksUsd) : 0
    })
    return {
      available: true,
      chartKind: "line",
      title: "Fleet revenue, net income & fleet capex",
      categories,
      series: [
        { seriesKey: "rev", label: "Revenue", values: rev },
        { seriesKey: "ni", label: "Net income", values: ni },
        { seriesKey: "fleet_capex", label: "Fleet trucks capex", values: fleetCx },
      ],
    }
  }

  // energy (default)
  const rev = is.map((r) =>
    Number.isFinite(r.revenue) ? convertUsdForDisplay(r.revenue, ctx).display : 0,
  )
  const ni = is.map((r) =>
    Number.isFinite(r.netIncome) ? convertUsdForDisplay(r.netIncome, ctx).display : 0,
  )
  return {
    available: true,
    chartKind: "line",
    title: "Revenue & net income trend",
    categories,
    series: [
      { seriesKey: "rev", label: "Revenue", values: rev },
      { seriesKey: "ni", label: "Net income", values: ni },
    ],
  }
}

function buildKpis(
  entityId: ModelEntityId,
  ctx: SelectorDisplayContext,
  scenario: {
    dailyEnergyDemandKwh: number | null
    dailySwapDemand: number | null
    totalRetailUsdPerKwh: number | null
    annualRevenueUsd: { display: number; usd: number } | null
    annualNetCashUsd: { display: number; usd: number } | null
  },
  lastIs: AnnualIncomeStatement | null,
  model: ModelRunOutput | undefined,
  binding: number,
  warningsInScope: number,
): EntityKpiItem[] {
  const out: EntityKpiItem[] = []

  if (entityId === "energy") {
    out.push({
      id: "daily_kwh",
      label: "Daily energy demand",
      value:
        scenario.dailyEnergyDemandKwh !== null &&
        Number.isFinite(scenario.dailyEnergyDemandKwh)
          ? `${formatDisplayNumber(scenario.dailyEnergyDemandKwh, ctx)} kWh`
          : "—",
    })
    out.push({
      id: "retail",
      label: "Blended retail (scenario, USD)",
      value:
        scenario.totalRetailUsdPerKwh !== null &&
        Number.isFinite(scenario.totalRetailUsdPerKwh)
          ? `${scenario.totalRetailUsdPerKwh.toFixed(4)} USD/kWh`
          : "—",
    })
  }

  if (entityId === "fleet") {
    out.push({
      id: "daily_swaps",
      label: "Daily swap demand",
      value:
        scenario.dailySwapDemand !== null && Number.isFinite(scenario.dailySwapDemand)
          ? formatDisplayNumber(scenario.dailySwapDemand, ctx)
          : "—",
    })
  }

  if (entityId === "platform" && model) {
    out.push({
      id: "ic_platform",
      label: "Platform revenue (Y1)",
      value: money(ctx, model.platformIntercompanyUsdPerYear),
    })
  }

  if (entityId === "fleet" && model) {
    out.push({
      id: "corridor_charge",
      label: "Fleet energy spend (Y1)",
      value: money(ctx, model.fleetCorridorChargeUsdPerYear),
    })
  }

  const analytics = model?.analytics.entities[entityId]
  if (analytics) {
    out.push({
      id: "entity_equity_irr",
      label: "Equity IRR",
      value: fmtIrr(ctx, analytics.returnMetrics.equityIrr),
    })
    out.push({
      id: "entity_wacc",
      label: "WACC",
      value:
        analytics.valuation.wacc !== null &&
        Number.isFinite(analytics.valuation.wacc)
          ? fmtIrr(ctx, analytics.valuation.wacc)
          : "--",
    })
  }

  out.push({
    id: "scenario_rev",
    label: "Scenario corridor revenue (annual)",
    value:
      scenario.annualRevenueUsd !== null
        ? `${formatDisplayNumber(scenario.annualRevenueUsd.display, ctx)} ${ctx.currencyCode}`
        : "—",
  })
  out.push({
    id: "scenario_net_cash",
    label: "Scenario corridor net cash (annual)",
    value:
      scenario.annualNetCashUsd !== null
        ? `${formatDisplayNumber(scenario.annualNetCashUsd.display, ctx)} ${ctx.currencyCode}`
        : "—",
  })
  out.push({
    id: "tail_rev",
    label: "Last year revenue (entity)",
    value: lastIs !== null ? money(ctx, lastIs.revenue) : "—",
  })
  out.push({
    id: "tail_ni",
    label: "Last year net income (entity)",
    value: lastIs !== null ? money(ctx, lastIs.netIncome) : "—",
  })
  out.push({
    id: "bind_c",
    label: "Binding constraints (entity scope)",
    value: String(binding),
  })
  out.push({
    id: "warn_scoped",
    label: "Warnings (entity scope)",
    value: String(warningsInScope),
  })

  return out
}

export function composeEntityPageDetail(
  entityId: ModelEntityId,
  ctx: SelectorDisplayContext,
  pack: EntityProjectionPack | undefined,
  model: ModelRunOutput | undefined,
  scenarioSlice: {
    dailyEnergyDemandKwh: number | null
    dailySwapDemand: number | null
    totalRetailUsdPerKwh: number | null
    annualRevenueUsd: { display: number; usd: number } | null
    annualNetCashUsd: { display: number; usd: number } | null
  },
  warnings: readonly SnapshotWarning[],
  constraints: readonly SnapshotConstraint[],
  lastIs: AnnualIncomeStatement | null,
) {
  const stages = new Set(ENTITY_WARNING_STAGES[entityId])
  const scoped = warnings.filter((w) => stages.has(w.stage))
  const scopedConstraints = constraints.filter((c) => stages.has(c.stage))
  const bindingScoped = scopedConstraints.filter((c) => c.binding).length
  const entityWarnings: EntityWarningItem[] = scoped.map((w) =>
    toEntityWarningItem(w),
  )
  const constraintItems: EntityConstraintItem[] = scopedConstraints.map((c) =>
    toEntityConstraintItem(c),
  )

  const dataAvailable =
    pack !== undefined &&
    pack.incomeStatement.length > 0

  const debtRows = pack?.debtSchedule ?? []
  const capexRows = pack?.capexDeployment ?? []
  const suRows = pack?.sourcesUses ?? []

  return {
    dataAvailable,
    kpis: buildKpis(
      entityId,
      ctx,
      scenarioSlice,
      lastIs,
      model,
      bindingScoped,
      scoped.length,
    ),
    incomeStatement: buildIncomeStatement(ctx, pack?.incomeStatement ?? []),
    balanceSheet: buildBalanceSheet(ctx, pack?.balanceSheet ?? []),
    cashFlowStatement: buildCashFlow(ctx, pack?.cashFlowStatement ?? []),
    equityStatement: buildEquityStatement(ctx, pack?.equityStatement ?? []),
    debtSchedule: buildDebtSchedule(ctx, debtRows),
    capexSchedule: buildCapexSchedule(ctx, capexRows),
    sourcesUsesSchedule: buildSourcesUses(ctx, suRows),
    corridorMetrics: buildCorridorMetrics(entityId, model, ctx),
    primaryChart: buildPrimaryChart(entityId, pack, ctx),
    entityWarnings,
    constraintItems,
  }
}
