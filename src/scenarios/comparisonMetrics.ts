import type { EngineOutput } from "@/engine/types"

export type ScenarioComparableMetrics = {
  headlineNpv: number | null
  unleveredNpv: number | null
  equityNpv: number | null
  unleveredIrr: number | null
  equityIrr: number | null
  moicEquity: number | null
  projectPayback: number | null
  minDscr: number | null
  totalCapexUsd: number | null
  totalRetailUsdPerKwh: number | null
  /** 1 = viable, 0 = not, null = unknown */
  viableScore: number | null
}

export function extractComparableMetrics(
  output: EngineOutput,
): ScenarioComparableMetrics {
  if (output.projection.status !== "ok") {
    return {
      headlineNpv: null,
      unleveredNpv: null,
      equityNpv: null,
      unleveredIrr: null,
      equityIrr: null,
      moicEquity: null,
      projectPayback: null,
      minDscr: null,
      totalCapexUsd: null,
      totalRetailUsdPerKwh: null,
      viableScore: null,
    }
  }
  const { scenario, model } = output.projection
  const p = scenario.pipeline
  const v = p.viability.viable
  return {
    headlineNpv: output.projection.headlineNpv,
    unleveredNpv: model?.returnMetrics.unleveredNpv ?? null,
    equityNpv: model?.returnMetrics.equityNpv ?? null,
    unleveredIrr: model?.returnMetrics.unleveredIrr ?? null,
    equityIrr: model?.returnMetrics.equityIrr ?? null,
    moicEquity: model?.returnMetrics.moicEquity ?? null,
    projectPayback: model?.analytics.corridor.payback.projectUndiscounted ?? null,
    minDscr: model?.coverage.minDscr ?? null,
    totalCapexUsd: p.capex.totalCapexUsd,
    totalRetailUsdPerKwh: p.pricing.totalRetailUsdPerKwh,
    viableScore: v ? 1 : 0,
  }
}

export type MetricKind = "money" | "perKwh" | "boolScore" | "multiple" | "years" | "ratio"

export type ScenarioMetricDefinition = {
  id: string
  label: string
  kind: MetricKind
  /** For numeric metrics; bool uses score where 1 is better */
  higherIsBetter: boolean
  pick: (m: ScenarioComparableMetrics) => number | null
}

export const SCENARIO_COMPARISON_METRICS: readonly ScenarioMetricDefinition[] = [
  {
    id: "headlineNpv",
    label: "Headline NPV",
    kind: "money",
    higherIsBetter: true,
    pick: (m) => m.headlineNpv,
  },
  {
    id: "unleveredNpv",
    label: "Unlevered NPV (model)",
    kind: "money",
    higherIsBetter: true,
    pick: (m) => m.unleveredNpv,
  },
  {
    id: "equityNpv",
    label: "Equity NPV (model)",
    kind: "money",
    higherIsBetter: true,
    pick: (m) => m.equityNpv,
  },
  {
    id: "unleveredIrr",
    label: "Unlevered IRR",
    kind: "ratio",
    higherIsBetter: true,
    pick: (m) => m.unleveredIrr,
  },
  {
    id: "equityIrr",
    label: "Equity IRR",
    kind: "ratio",
    higherIsBetter: true,
    pick: (m) => m.equityIrr,
  },
  {
    id: "moicEquity",
    label: "MOIC (equity)",
    kind: "multiple",
    higherIsBetter: true,
    pick: (m) => m.moicEquity,
  },
  {
    id: "projectPayback",
    label: "Project payback",
    kind: "years",
    higherIsBetter: false,
    pick: (m) => m.projectPayback,
  },
  {
    id: "minDscr",
    label: "Min DSCR",
    kind: "multiple",
    higherIsBetter: true,
    pick: (m) => m.minDscr,
  },
  {
    id: "totalCapexUsd",
    label: "Corridor capex (scenario)",
    kind: "money",
    higherIsBetter: false,
    pick: (m) => m.totalCapexUsd,
  },
  {
    id: "totalRetailUsdPerKwh",
    label: "Retail stack (USD/kWh)",
    kind: "perKwh",
    higherIsBetter: false,
    pick: (m) => m.totalRetailUsdPerKwh,
  },
  {
    id: "viable",
    label: "Pipeline viable",
    kind: "boolScore",
    higherIsBetter: true,
    pick: (m) => m.viableScore,
  },
] as const

/** Indices of tied bests among finite numeric samples (empty if none finite). */
export function indicesOfBestValues(
  values: readonly (number | null)[],
  higherIsBetter: boolean,
): Set<number> {
  const pairs = values
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: number; i: number } => x.v !== null && Number.isFinite(x.v))
  if (pairs.length === 0) return new Set()
  const target = higherIsBetter
    ? Math.max(...pairs.map((p) => p.v))
    : Math.min(...pairs.map((p) => p.v))
  return new Set(pairs.filter((p) => p.v === target).map((p) => p.i))
}

export function formatPercentDelta(
  base: number,
  value: number,
  locale: string,
): string {
  if (!Number.isFinite(base) || base === 0) return "—"
  const r = (value - base) / Math.abs(base)
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
    signDisplay: "exceptZero",
  }).format(r)
}

export function formatAbsoluteDelta(
  value: number,
  base: number,
  locale: string,
): string {
  const d = value - base
  if (!Number.isFinite(d)) return "—"
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  }).format(d)
}
