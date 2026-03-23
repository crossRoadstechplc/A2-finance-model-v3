import { nearlyEqual } from "@/finance/math"
import { convertUsdForDisplay, formatDisplayNumber } from "@/selectors/convert"
import type { SelectorDisplayContext } from "@/selectors/context"
import { getOkProjection } from "@/selectors/input"
import type { EcisSelectorInput } from "@/selectors/input"
import { selectPriceStackFromPipeline } from "@/selectors/priceStack"
import type {
  ConsolidatedBusinessViability,
  ConsolidatedCircularConvergence,
  ConsolidatedDieselParity,
  ConsolidatedEconomicsLine,
  ConsolidatedFundingTimeline,
  ConsolidatedPageViewModel,
  EntityDocumentTable,
} from "@/selectors/types"
import { PAGE_VM_VERSION } from "@/selectors/types"
import type { ModelRunOutput, SourcesUsesRow } from "@/model/types"
import type { ScenarioPipelineOutputs } from "@/snapshot/types"

export const CONSOLIDATED_DIESEL_BENCHMARK_USD_PER_KWH = 0.22

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
  }).format(irr)
}

function fmtMoic(ctx: SelectorDisplayContext, m: number | null): string {
  if (m === null || !Number.isFinite(m)) return "—"
  return `${formatDisplayNumber(m, ctx)}x`
}

function dieselCrossover(
  a2Usd: number | null,
  benchUsd: number,
): ConsolidatedDieselParity["crossover"] {
  if (a2Usd === null || !Number.isFinite(a2Usd)) return "unknown"
  if (nearlyEqual(a2Usd, benchUsd, 1e-7)) return "at_par"
  return a2Usd < benchUsd ? "a2_below_diesel" : "a2_above_diesel"
}

function buildDieselParity(
  ctx: SelectorDisplayContext,
  totalRetailUsdPerKwh: number | null | undefined,
): ConsolidatedDieselParity {
  const bench = CONSOLIDATED_DIESEL_BENCHMARK_USD_PER_KWH
  const benchDisp = convertUsdForDisplay(bench, ctx).display
  const a2Usd =
    totalRetailUsdPerKwh !== undefined &&
    totalRetailUsdPerKwh !== null &&
    Number.isFinite(totalRetailUsdPerKwh)
      ? totalRetailUsdPerKwh
      : null
  const a2Disp =
    a2Usd !== null ? convertUsdForDisplay(a2Usd, ctx).display : null
  const cross = dieselCrossover(a2Usd, bench)
  const summary =
    cross === "unknown"
      ? "Retail stack unavailable — run a successful projection."
      : cross === "at_par"
        ? "A2 retail is at the diesel parity benchmark."
        : cross === "a2_below_diesel"
          ? "A2 retail is below the diesel parity benchmark (favorable vs benchmark)."
          : "A2 retail is above the diesel parity benchmark."

  return {
    available: a2Usd !== null,
    benchmarkUsdPerKwh: bench,
    benchmarkLabel: "Diesel retail equivalent (benchmark)",
    a2RetailUsdPerKwh: a2Usd,
    a2RetailDisplayPerKwh:
      a2Disp !== null && Number.isFinite(a2Disp) ? a2Disp : null,
    benchmarkDisplayPerKwh: Number.isFinite(benchDisp) ? benchDisp : bench,
    crossover: cross,
    summaryLine: summary,
  }
}

function eliminationAdjustedRevenueOk(
  model: ModelRunOutput,
  periodIndex: number,
): boolean {
  const i = periodIndex - 1
  if (i < 0) return false
  const e = model.entities.energy.incomeStatement[i]?.revenue
  const p = model.entities.platform.incomeStatement[i]?.revenue
  const f = model.entities.fleet.incomeStatement[i]?.revenue
  const c = model.consolidated[i]?.incomeStatement.revenue
  if (e === undefined || p === undefined || f === undefined || c === undefined) {
    return false
  }
  const eliminationAmount = model.eliminations
    .filter((line) => line.periodIndex === periodIndex)
    .reduce((sum, line) => sum + line.amountUsd, 0)
  return nearlyEqual(e + p + f - eliminationAmount, c, 1e-2)
}

function balanceSheetBalances(
  model: ModelRunOutput,
  periodIndex: number,
): boolean {
  const i = periodIndex - 1
  if (i < 0) return false
  const bs = model.consolidated[i]?.balanceSheet
  if (!bs) return false
  return nearlyEqual(bs.totalAssets, bs.totalLiabilitiesAndEquity, 1e-2)
}

function buildCircularConvergence(
  model: ModelRunOutput | undefined,
): ConsolidatedCircularConvergence {
  if (!model || model.consolidated.length === 0) {
    return {
      status: "not_applicable",
      label: "No consolidated model",
      detail: "Run recompute after a full projection to evaluate consolidation checks.",
      checks: [],
    }
  }
  const lastP = model.consolidated[model.consolidated.length - 1]!.periodIndex
  const checks = [
    {
      id: "bs_identity",
      label: "Consolidated balance sheet balances (assets = L+E)",
      ok: balanceSheetBalances(model, lastP),
    },
    {
      id: "elimination_revenue",
      label:
        "Elimination-adjusted revenue (entities less booked eliminations) = consolidated",
      ok: eliminationAdjustedRevenueOk(model, lastP),
    },
  ] as const
  const allOk = checks.every((check) => check.ok)
  return {
    status: allOk ? "ok" : "failed_check",
    label: allOk ? "Consolidation converged" : "Consolidation check failed",
    detail: allOk
      ? "Intercompany eliminations tie to consolidated statements for the tail period."
      : "Review failed checks — entity sums or balance identity may diverge.",
    checks,
  }
}

function buildBusinessViability(
  pipeline: ScenarioPipelineOutputs | undefined,
): ConsolidatedBusinessViability {
  if (!pipeline) return { available: false, viable: null, reasons: [] }
  return {
    available: true,
    viable: pipeline.viability.viable,
    reasons: [...pipeline.viability.reasons],
  }
}

function buildEconomicsSummary(
  ctx: SelectorDisplayContext,
  model: ModelRunOutput | undefined,
  last: ModelRunOutput["consolidated"][number] | null,
  scenarioCapexUsd: number | null,
): ConsolidatedPageViewModel["economicsSummary"] {
  const lines: ConsolidatedEconomicsLine[] = []
  if (last && model) {
    lines.push({
      label: "Consolidated revenue (tail year)",
      value: money(ctx, last.incomeStatement.revenue),
      note: "Elimination-adjusted consolidated total (not a simple sum of entity revenues).",
    })
    lines.push({
      label: "Consolidated net income (tail year)",
      value: money(ctx, last.incomeStatement.netIncome),
    })
    lines.push({
      label: "Enterprise value",
      value:
        model.analytics.corridor.valuation.enterpriseValue !== null
          ? money(ctx, model.analytics.corridor.valuation.enterpriseValue)
          : "—",
    })
  } else {
    lines.push({ label: "Consolidated revenue (tail year)", value: "—" })
    lines.push({ label: "Consolidated net income (tail year)", value: "—" })
    lines.push({ label: "Enterprise value", value: "—" })
  }
  lines.push({
    label: "Corridor total capex (scenario)",
    value:
      scenarioCapexUsd !== null && Number.isFinite(scenarioCapexUsd)
        ? money(ctx, scenarioCapexUsd)
        : "—",
  })
  return { lines }
}

type EntityTableRow = EntityDocumentTable["rows"][number]

function buildInvestmentSummary(
  ctx: SelectorDisplayContext,
  rm: ModelRunOutput["returnMetrics"] | undefined,
  cov: ModelRunOutput["coverage"] | undefined,
  analytics: ModelRunOutput["analytics"]["corridor"] | undefined,
  scenarioCapexUsd: number | null,
  y1Uses: number | null,
): EntityDocumentTable {
  const rows: EntityTableRow[] = [
    {
      rowKey: "capex_scenario",
      label: "Corridor total capex (scenario engine)",
      values: [
        scenarioCapexUsd !== null && Number.isFinite(scenarioCapexUsd)
          ? money(ctx, scenarioCapexUsd)
          : "—",
      ],
    },
    {
      rowKey: "y1_uses",
      label: "Year 1 total uses (model)",
      values: [y1Uses !== null && Number.isFinite(y1Uses) ? money(ctx, y1Uses) : "—"],
    },
    {
      rowKey: "npv_u",
      label: "Unlevered NPV",
      values: [rm ? money(ctx, rm.unleveredNpv) : "—"],
    },
    {
      rowKey: "npv_e",
      label: "Equity NPV",
      values: [rm ? money(ctx, rm.equityNpv) : "—"],
    },
    {
      rowKey: "irr_u",
      label: "Unlevered IRR",
      values: [rm ? fmtIrr(ctx, rm.unleveredIrr) : "—"],
    },
    {
      rowKey: "irr_e",
      label: "Equity IRR",
      values: [rm ? fmtIrr(ctx, rm.equityIrr) : "—"],
    },
    {
      rowKey: "moic_u",
      label: "MOIC (unlevered)",
      values: [rm ? fmtMoic(ctx, rm.moicUnlevered) : "—"],
    },
    {
      rowKey: "moic_e",
      label: "MOIC (equity)",
      values: [rm ? fmtMoic(ctx, rm.moicEquity) : "—"],
    },
    {
      rowKey: "payback_project",
      label: "Project payback",
      values: [
        analytics?.payback.projectUndiscounted !== null &&
        analytics?.payback.projectUndiscounted !== undefined
          ? `${formatDisplayNumber(analytics.payback.projectUndiscounted, ctx)} yrs`
          : "—",
      ],
    },
    {
      rowKey: "payback_equity",
      label: "Equity payback",
      values: [
        analytics?.payback.equityUndiscounted !== null &&
        analytics?.payback.equityUndiscounted !== undefined
          ? `${formatDisplayNumber(analytics.payback.equityUndiscounted, ctx)} yrs`
          : "—",
      ],
    },
    {
      rowKey: "wacc",
      label: "WACC",
      values: [
        analytics?.valuation.wacc !== null &&
        analytics?.valuation.wacc !== undefined &&
        Number.isFinite(analytics.valuation.wacc)
          ? fmtIrr(ctx, analytics.valuation.wacc)
          : "—",
      ],
    },
    {
      rowKey: "dscr",
      label: "Min DSCR",
      values: [
        cov && Number.isFinite(cov.minDscr)
          ? formatDisplayNumber(cov.minDscr, ctx)
          : "—",
      ],
    },
    {
      rowKey: "avg_dscr",
      label: "Avg DSCR",
      values: [
        cov?.avgDscr !== null &&
        cov?.avgDscr !== undefined &&
        Number.isFinite(cov.avgDscr)
          ? formatDisplayNumber(cov.avgDscr, ctx)
          : "—",
      ],
    },
    {
      rowKey: "llcr",
      label: "LLCR",
      values: [
        cov?.llcr !== null && cov?.llcr !== undefined && Number.isFinite(cov.llcr)
          ? formatDisplayNumber(cov.llcr, ctx)
          : "—",
      ],
    },
    {
      rowKey: "plcr",
      label: "PLCR",
      values: [
        cov?.plcr !== null && cov?.plcr !== undefined && Number.isFinite(cov.plcr)
          ? formatDisplayNumber(cov.plcr, ctx)
          : "—",
      ],
    },
  ]

  return {
    id: "investment_summary",
    title: "Corridor investment summary",
    caption: "Returns and coverage from the consolidated model; capex and uses from the corridor schedules.",
    columns: ["Value"],
    rows,
  }
}

function buildSourcesUsesTable(
  ctx: SelectorDisplayContext,
  rows: readonly SourcesUsesRow[],
): EntityDocumentTable {
  if (rows.length === 0) {
    return {
      id: "consol_su",
      title: "Consolidated sources & uses",
      caption: "Corridor funding vs spend by period.",
      columns: [],
      rows: [],
    }
  }
  return {
    id: "consol_su",
    title: "Consolidated sources & uses",
    caption: "Uses categories sum to total uses per period when the model is consistent.",
    columns: [
      "Equity",
      "Debt draw",
      "Total sources",
      "Energy infra",
      "Energy battery",
      "Platform",
      "Fleet",
      "Total uses",
    ],
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

function combineSourcesUses(
  model: ModelRunOutput | undefined,
): SourcesUsesRow[] {
  if (!model) return []
  const byPeriod = new Map<number, SourcesUsesRow>()
  for (const entityId of ["energy", "platform", "fleet"] as const) {
    for (const row of model.entities[entityId].sourcesUses) {
      const current = byPeriod.get(row.periodIndex) ?? {
        periodIndex: row.periodIndex,
        equityContributionUsd: 0,
        debtDrawUsd: 0,
        totalSourcesUsd: 0,
        energyInfrastructureUsd: 0,
        energyBatteryUsd: 0,
        platformUsd: 0,
        fleetTrucksUsd: 0,
        totalUsesUsd: 0,
      }
      current.equityContributionUsd += row.equityContributionUsd
      current.debtDrawUsd += row.debtDrawUsd
      current.totalSourcesUsd += row.totalSourcesUsd
      current.energyInfrastructureUsd += row.energyInfrastructureUsd
      current.energyBatteryUsd += row.energyBatteryUsd
      current.platformUsd += row.platformUsd
      current.fleetTrucksUsd += row.fleetTrucksUsd
      current.totalUsesUsd += row.totalUsesUsd
      byPeriod.set(row.periodIndex, current)
    }
  }
  return [...byPeriod.values()].sort((a, b) => a.periodIndex - b.periodIndex)
}

function buildFundingTimeline(
  ctx: SelectorDisplayContext,
  rows: readonly SourcesUsesRow[],
): ConsolidatedFundingTimeline {
  if (rows.length === 0) return { available: false, rows: [] }
  return {
    available: true,
    rows: rows.map((r) => {
      const sumCat =
        r.energyInfrastructureUsd +
        r.energyBatteryUsd +
        r.platformUsd +
        r.fleetTrucksUsd
      return {
        rowKey: `ft-y${r.periodIndex}`,
        period: `Y${r.periodIndex}`,
        equity: money(ctx, r.equityContributionUsd),
        debt: money(ctx, r.debtDrawUsd),
        totalSources: money(ctx, r.totalSourcesUsd),
        totalUses: money(ctx, r.totalUsesUsd),
        sumCategoryUses: money(ctx, sumCat),
        categoriesMatchUses: nearlyEqual(sumCat, r.totalUsesUsd, 1e-2),
      }
    }),
  }
}

export function selectConsolidatedPageViewModel(
  input: EcisSelectorInput,
  ctx: SelectorDisplayContext,
): ConsolidatedPageViewModel {
  const proj = getOkProjection(input.results.engineOutput)
  const pipeline = proj?.scenario.pipeline
  const model = proj?.model
  const last =
    model && model.consolidated.length > 0
      ? model.consolidated[model.consolidated.length - 1]!
      : null
  const rm = model?.returnMetrics
  const cov = model?.coverage
  const corridorAnalytics = model?.analytics.corridor
  const suRows = combineSourcesUses(model)
  const scenarioCapexUsd = pipeline?.capex.totalCapexUsd ?? null

  return {
    version: PAGE_VM_VERSION,
    corridorName: input.platform.corridorName,
    model: {
      available: model !== undefined,
      periodCount: model?.periodCount ?? null,
      lastYear: {
        revenue:
          last !== null ? convertUsdForDisplay(last.incomeStatement.revenue, ctx) : null,
        netIncome:
          last !== null ? convertUsdForDisplay(last.incomeStatement.netIncome, ctx) : null,
        totalAssets:
          last !== null ? convertUsdForDisplay(last.balanceSheet.totalAssets, ctx) : null,
      },
      returnMetrics: {
        unleveredNpv: rm ? convertUsdForDisplay(rm.unleveredNpv, ctx) : null,
        equityNpv: rm ? convertUsdForDisplay(rm.equityNpv, ctx) : null,
        unleveredIrr: rm?.unleveredIrr ?? null,
        equityIrr: rm?.equityIrr ?? null,
        moicUnlevered:
          rm && Number.isFinite(rm.moicUnlevered) ? rm.moicUnlevered : null,
        moicEquity: rm && Number.isFinite(rm.moicEquity) ? rm.moicEquity : null,
      },
      coverage: {
        minDscr: cov && Number.isFinite(cov.minDscr) ? cov.minDscr : null,
        llcr:
          cov?.llcr !== null && cov?.llcr !== undefined && Number.isFinite(cov.llcr)
            ? cov.llcr
            : null,
        plcr:
          cov?.plcr !== null && cov?.plcr !== undefined && Number.isFinite(cov.plcr)
            ? cov.plcr
            : null,
      },
      eliminationsPerYear:
        model !== undefined
          ? model.eliminations.filter((e) => e.periodIndex === 1).length
          : null,
    },
    priceStack: selectPriceStackFromPipeline(ctx, pipeline),
    dieselParity: buildDieselParity(ctx, pipeline?.pricing.totalRetailUsdPerKwh),
    economicsSummary: buildEconomicsSummary(ctx, model, last, scenarioCapexUsd),
    circularConvergence: buildCircularConvergence(model),
    businessViability: buildBusinessViability(pipeline),
    investmentSummary: buildInvestmentSummary(
      ctx,
      rm,
      cov,
      corridorAnalytics,
      scenarioCapexUsd,
      suRows[0]?.totalUsesUsd ?? null,
    ),
    sourcesUses: buildSourcesUsesTable(ctx, suRows),
    fundingTimeline: buildFundingTimeline(ctx, suRows),
  }
}
