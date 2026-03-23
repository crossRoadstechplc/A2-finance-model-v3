import { convertUsdForDisplay, formatDisplayNumber } from "@/selectors/convert"
import type { SelectorDisplayContext } from "@/selectors/context"
import { getOkProjection } from "@/selectors/input"
import type { EcisSelectorInput } from "@/selectors/input"
import { selectPriceStackFromPipeline } from "@/selectors/priceStack"
import {
  toDashboardConstraintBanner,
  toDashboardWarningBanner,
} from "@/selectors/warningGuidance"
import type {
  DashboardConstraintBanner,
  DashboardEntityQuickSummary,
  DashboardFundingCapacity,
  DashboardSummaryCard,
  DashboardViewModel,
} from "@/selectors/types"
import { PAGE_VM_VERSION } from "@/selectors/types"
import type { ModelEntityId } from "@/model/types"

const ENTITY_TITLES: Record<ModelEntityId, string> = {
  energy: "A2 Energy",
  platform: "A2 Platform",
  fleet: "Fleet",
}

function fmtMoney(ctx: SelectorDisplayContext, amountUsd: number): string {
  const d = convertUsdForDisplay(amountUsd, ctx)
  return `${formatDisplayNumber(d.display, ctx)} ${ctx.currencyCode}`
}

function fmtRatePerKwh(ctx: SelectorDisplayContext, usdPerKwh: number): string {
  const d = convertUsdForDisplay(usdPerKwh, ctx)
  if (!Number.isFinite(d.display)) return "—"
  const s = new Intl.NumberFormat(ctx.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(d.display)
  return `${s} ${ctx.currencyCode}/kWh`
}

function fmtQty(ctx: SelectorDisplayContext, n: number, unit?: string): string {
  if (!Number.isFinite(n)) return "—"
  const s = formatDisplayNumber(n, ctx)
  return unit ? `${s} ${unit}` : s
}

function buildConvergence(
  input: EcisSelectorInput,
  proj: ReturnType<typeof getOkProjection>,
): DashboardViewModel["convergence"] {
  if (input.results.status === "idle") {
    return {
      status: "idle",
      label: "No run yet",
      detail: "Run recompute to populate the corridor view.",
    }
  }
  if (input.results.status === "stale") {
    return {
      status: "stale",
      label: "Stale",
      detail: "Assumptions changed since the last engine pass.",
    }
  }
  if (input.results.lastError) {
    return {
      status: "error",
      label: "Run error",
      detail: input.results.lastError,
    }
  }
  const p = input.results.engineOutput?.projection
  if (p?.status === "failed") {
    return {
      status: "error",
      label: "Projection failed",
      detail: p.error,
    }
  }
  if (proj === null) {
    return {
      status: "error",
      label: "No projection",
      detail: null,
    }
  }
  if (!proj.model) {
    return {
      status: "projection_only",
      label: "Scenario only",
      detail: "Snapshot pipeline ok; financial model did not attach.",
    }
  }
  return {
    status: "ok",
    label: "Model converged",
    detail: `${proj.model.periodCount} operating periods in view.`,
  }
}

function buildCorridorCards(
  ctx: SelectorDisplayContext,
  pipeline: NonNullable<ReturnType<typeof getOkProjection>>["scenario"]["pipeline"],
): readonly DashboardSummaryCard[] {
  const d = pipeline.demand
  const inf = pipeline.infrastructure
  const cx = pipeline.capex
  const ef = pipeline.entityFinancials
  const pr = pipeline.pricing

  const chargeHead = inf.maxDailyChargingKwh - d.dailyEnergyDemandKwh
  const swapHead = inf.maxDailySwapThroughput - d.dailySwapDemand

  return [
    {
      id: "demand",
      title: "Demand",
      lines: [
        { label: "Fleet vehicles", value: fmtQty(ctx, d.exogenousFleetVehicles) },
        {
          label: "Daily energy",
          value: `${fmtQty(ctx, d.dailyEnergyDemandKwh)} kWh`,
        },
        {
          label: "Daily swaps",
          value: fmtQty(ctx, d.dailySwapDemand),
        },
        {
          label: "Charging share",
          value: Number.isFinite(d.fleetChargingShare)
            ? `${formatDisplayNumber(d.fleetChargingShare * 100, ctx)}%`
            : "—",
        },
      ],
    },
    {
      id: "infrastructure",
      title: "Infrastructure",
      lines: [
        { label: "Scaling band", value: inf.scalingBandId },
        { label: "Stations", value: fmtQty(ctx, inf.stations) },
        { label: "Sockets", value: fmtQty(ctx, inf.sockets) },
        { label: "Swap bays", value: fmtQty(ctx, inf.bays) },
        {
          label: "Charging headroom",
          value: Number.isFinite(chargeHead)
            ? `${fmtQty(ctx, chargeHead)} kWh/day`
            : "—",
        },
        {
          label: "Swap headroom",
          value: Number.isFinite(swapHead)
            ? `${fmtQty(ctx, swapHead)} /day`
            : "—",
        },
      ],
    },
    {
      id: "capex_pricing",
      title: "Capex & retail stack",
      lines: [
        { label: "Total capex", value: fmtMoney(ctx, cx.totalCapexUsd) },
        {
          label: "Retail (blended)",
          value: fmtRatePerKwh(ctx, pr.totalRetailUsdPerKwh),
        },
      ],
    },
    {
      id: "corridor_economics",
      title: "Corridor economics",
      lines: [
        { label: "Annual revenue", value: fmtMoney(ctx, ef.annualRevenueUsd) },
        { label: "Annual net cash", value: fmtMoney(ctx, ef.annualNetCashUsd) },
        { label: "Annual grid cost", value: fmtMoney(ctx, ef.annualGridCostUsd) },
        { label: "Annual opex", value: fmtMoney(ctx, ef.annualOpexUsd) },
      ],
    },
  ]
}

function placeholderCards(): readonly DashboardSummaryCard[] {
  const line = (label: string) => ({ label, value: "—" as const })
  return [
    {
      id: "demand",
      title: "Demand",
      lines: [line("Fleet vehicles"), line("Daily energy"), line("Daily swaps")],
    },
    {
      id: "infrastructure",
      title: "Infrastructure",
      lines: [line("Scaling band"), line("Stations"), line("Sockets"), line("Swap bays")],
    },
    {
      id: "capex_pricing",
      title: "Capex & retail stack",
      lines: [line("Total capex"), line("Retail (blended)")],
    },
    {
      id: "corridor_economics",
      title: "Corridor economics",
      lines: [line("Annual revenue"), line("Annual net cash")],
    },
  ]
}

function buildEntitySummaries(
  ctx: SelectorDisplayContext,
  proj: ReturnType<typeof getOkProjection>,
): readonly DashboardEntityQuickSummary[] {
  const warnings = proj?.scenario.warnings ?? []
  const binding = (proj?.scenario.constraints ?? []).filter((c) => c.binding).length
  const highlight = warnings.length > 0 || binding > 0
  const model = proj?.model
  const ids: ModelEntityId[] = ["energy", "platform", "fleet"]

  return ids.map((entityId) => {
    const pack = model?.entities[entityId]
    const lastIs =
      pack && pack.incomeStatement.length > 0
        ? pack.incomeStatement[pack.incomeStatement.length - 1]!
        : null

    const lines: { label: string; value: string }[] = []
    if (lastIs) {
      lines.push({
        label: "Last year revenue",
        value: fmtMoney(ctx, lastIs.revenue),
      })
      lines.push({
        label: "Last year net income",
        value: fmtMoney(ctx, lastIs.netIncome),
      })
    } else {
      lines.push({ label: "Last year revenue", value: "—" })
      lines.push({ label: "Last year net income", value: "—" })
    }
    lines.push({
      label: "Warnings (scenario)",
      value: String(warnings.length),
    })
    lines.push({
      label: "Binding constraints",
      value: String(binding),
    })

    return {
      entityId,
      title: ENTITY_TITLES[entityId],
      lines,
      highlight,
    }
  })
}

function buildFundingCapacity(
  ctx: SelectorDisplayContext,
  proj: ReturnType<typeof getOkProjection>,
  pipeline: NonNullable<ReturnType<typeof getOkProjection>>["scenario"]["pipeline"] | null,
): DashboardFundingCapacity {
  const model = proj?.model
  if (!model) {
    return {
      available: false,
      minDscr: null,
      llcr: null,
      plcr: null,
      chargingHeadroomKwh: null,
      swapHeadroom: null,
      totalCapex: pipeline
        ? convertUsdForDisplay(pipeline.capex.totalCapexUsd, ctx)
        : null,
    }
  }
  const cov = model.coverage
  const d = pipeline?.demand
  const inf = pipeline?.infrastructure

  const chargingHeadroomKwh =
    d && inf ? inf.maxDailyChargingKwh - d.dailyEnergyDemandKwh : null
  const swapHeadroom =
    d && inf ? inf.maxDailySwapThroughput - d.dailySwapDemand : null

  return {
    available: true,
    minDscr: Number.isFinite(cov.minDscr) ? cov.minDscr : null,
    llcr: cov.llcr,
    plcr: cov.plcr,
    chargingHeadroomKwh:
      chargingHeadroomKwh !== null && Number.isFinite(chargingHeadroomKwh)
        ? chargingHeadroomKwh
        : null,
    swapHeadroom:
      swapHeadroom !== null && Number.isFinite(swapHeadroom) ? swapHeadroom : null,
    totalCapex: pipeline
      ? convertUsdForDisplay(pipeline.capex.totalCapexUsd, ctx)
      : null,
  }
}

export function selectDashboardViewModel(
  input: EcisSelectorInput,
  ctx: SelectorDisplayContext,
): DashboardViewModel {
  const proj = getOkProjection(input.results.engineOutput)
  const snap = input.snapshot
  const pipeline = proj?.scenario.pipeline ?? null

  const projectionFailed = input.results.engineOutput?.projection
  const projectionError =
    projectionFailed?.status === "failed" ? projectionFailed.error : null

  const headlineNpv =
    proj !== null
      ? convertUsdForDisplay(proj.headlineNpv, ctx)
      : null

  const viable = proj?.scenario.pipeline.viability.viable ?? null
  const viabilityReasons = proj?.scenario.pipeline.viability.reasons ?? []

  const periods =
    proj?.periods.map((p) => ({
      periodIndex: p.periodIndex,
      placeholderNetCash: convertUsdForDisplay(p.placeholderNetCash, ctx),
    })) ?? []

  const model = proj?.model
  const lastConsolidated =
    model && model.consolidated.length > 0
      ? model.consolidated[model.consolidated.length - 1]!
      : null

  const warningBanners =
    proj?.scenario.warnings.map((w) => toDashboardWarningBanner(w)) ?? []

  const constraintBanners: DashboardConstraintBanner[] =
    proj?.scenario.constraints.map((c) => toDashboardConstraintBanner(c)) ?? []

  const priceStack =
    pipeline !== null
      ? selectPriceStackFromPipeline(ctx, pipeline)
      : { available: false, totalDisplayPerKwh: 0, segments: [] }

  const corridorSummaryCards =
    pipeline !== null ? buildCorridorCards(ctx, pipeline) : placeholderCards()

  const entityQuickSummaries = buildEntitySummaries(ctx, proj)

  const fundingCapacity = buildFundingCapacity(ctx, proj, pipeline)

  return {
    version: PAGE_VM_VERSION,
    resultsStatus: input.results.status,
    lastError: input.results.lastError,
    corridorName: input.platform.corridorName,
    modelHorizonYears: input.system.modelHorizonYears,
    vehicleCount: input.fleet.vehicleCount,
    recomputeRevision: input.recomputeMeta.revision,
    lastRunAt: input.recomputeMeta.lastRunAt,
    snapshotLabel: snap?.label ?? null,
    snapshotStatus:
      snap === null
        ? "none"
        : snap.status === "failed"
          ? "failed"
          : "ok",
    alerts: {
      showStaleHint: input.results.status === "stale",
      resultsError: input.results.lastError,
      projectionError,
    },
    convergence: buildConvergence(input, proj),
    warningBanners,
    constraintBanners,
    headline: {
      available: proj !== null,
      headlineNpv,
      viable,
      viabilityReasons: [...viabilityReasons],
    },
    priceStack,
    chart: {
      available: proj !== null && periods.length > 0,
      periods,
    },
    model: {
      available: model !== undefined,
      periodCount: model?.periodCount ?? null,
      consolidatedLastNetIncome:
        lastConsolidated !== null
          ? convertUsdForDisplay(
              lastConsolidated.incomeStatement.netIncome,
              ctx,
            )
          : null,
      unleveredNpv:
        model !== undefined
          ? convertUsdForDisplay(model.returnMetrics.unleveredNpv, ctx)
          : null,
      equityNpv:
        model !== undefined
          ? convertUsdForDisplay(model.returnMetrics.equityNpv, ctx)
          : null,
    },
    corridorSummaryCards,
    entityQuickSummaries,
    fundingCapacity,
  }
}
