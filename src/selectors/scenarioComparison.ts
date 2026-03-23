import type { SelectorDisplayContext } from "@/selectors/context"
import { convertUsdForDisplay, formatDisplayNumber } from "@/selectors/convert"
import type { EcisSelectorInput } from "@/selectors/input"
import type {
  ScenarioComparisonRow,
  ScenarioComparisonViewModel,
} from "@/selectors/types"
import { PAGE_VM_VERSION } from "@/selectors/types"
import {
  extractComparableMetrics,
  formatAbsoluteDelta,
  formatPercentDelta,
  indicesOfBestValues,
  type MetricKind,
  SCENARIO_COMPARISON_METRICS,
} from "@/scenarios/comparisonMetrics"
import { runEngineForAssumptionsSnapshot } from "@/scenarios/runEngineForAssumptionsSnapshot"
import { buildAssumptionsSnapshot } from "@/store/defaults"

function formatMetricValue(
  ctx: SelectorDisplayContext,
  kind: MetricKind,
  v: number | null,
): string {
  if (v === null || !Number.isFinite(v)) return "—"
  if (kind === "money") {
    const d = convertUsdForDisplay(v, ctx)
    return `${formatDisplayNumber(d.display, ctx)} ${ctx.currencyCode}`
  }
  if (kind === "perKwh") {
    return `${formatDisplayNumber(v, ctx)} USD/kWh`
  }
  if (kind === "multiple") {
    return `${formatDisplayNumber(v, ctx)}x`
  }
  if (kind === "years") {
    return `${formatDisplayNumber(v, ctx)} yrs`
  }
  if (kind === "ratio") {
    return new Intl.NumberFormat(ctx.locale, {
      style: "percent",
      maximumFractionDigits: 2,
    }).format(v)
  }
  return v >= 1 ? "Yes" : "No"
}

export function selectScenarioComparisonViewModel(
  input: EcisSelectorInput,
  ctx: SelectorDisplayContext,
): ScenarioComparisonViewModel {
  const baseSnap = buildAssumptionsSnapshot({
    settings: input.settings,
    system: input.system,
    platform: input.platform,
    energy: input.energy,
    fleet: input.fleet,
    controls: input.controls,
    snapshotModel: input.snapshotModel,
    scalingBands: input.scalingBands,
  })

  const orderedIds = input.workspace.comparisonScenarioIds
    .filter((id) => input.scenarios.named[id])
    .slice()
    .sort((a, b) =>
      input.scenarios.named[a]!.createdAt.localeCompare(
        input.scenarios.named[b]!.createdAt,
      ),
    )

  const columns: ScenarioComparisonViewModel["columns"] = [
    { id: "__live__", label: "Current inputs", kind: "live" },
    ...orderedIds.map((id) => ({
      id,
      label: input.scenarios.named[id]!.name,
      kind: "named" as const,
    })),
  ]

  const liveOut = runEngineForAssumptionsSnapshot(baseSnap)
  const metricCols = [
    extractComparableMetrics(liveOut),
    ...orderedIds.map((id) =>
      extractComparableMetrics(
        runEngineForAssumptionsSnapshot(input.scenarios.named[id]!.assumptions),
      ),
    ),
  ]

  const multi = metricCols.length > 1
  const rows: ScenarioComparisonRow[] = []

  for (const def of SCENARIO_COMPARISON_METRICS) {
    const raw = metricCols.map((m) => def.pick(m))
    const hasComparable = raw.some((x) => x !== null && Number.isFinite(x))
    const best =
      multi && hasComparable
        ? indicesOfBestValues(raw, def.higherIsBetter)
        : new Set<number>()
    const baseVal = raw[0] ?? null

    const cells = metricCols.map((_, ci) => {
      const v = raw[ci] ?? null
      const value = formatMetricValue(ctx, def.kind, v)
      let deltaAbsolute: string | null = null
      let deltaPercent: string | null = null
      if (ci > 0 && baseVal !== null && v !== null) {
        if (def.kind === "boolScore") {
          if (baseVal !== v) {
            deltaAbsolute = v > baseVal ? "-> Yes" : "-> No"
          }
        } else {
          deltaAbsolute = formatAbsoluteDelta(v, baseVal, ctx.locale)
          deltaPercent = formatPercentDelta(baseVal, v, ctx.locale)
        }
      }
      const highlight: "none" | "best" =
        multi && best.has(ci) && hasComparable ? "best" : "none"
      return { value, deltaAbsolute, deltaPercent, highlight }
    })

    rows.push({
      metricId: def.id,
      metricLabel: def.label,
      cells,
    })
  }

  return {
    version: PAGE_VM_VERSION,
    columns,
    rows,
    emptyComparisonHint:
      orderedIds.length === 0
        ? 'Tick "Compare" on named scenarios to show them next to current inputs.'
        : null,
    enginePathNote:
      "Each column uses assumptionsToEngineInput -> runEngine (same path as Recompute).",
  }
}
