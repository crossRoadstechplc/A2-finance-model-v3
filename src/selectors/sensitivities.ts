import type { SelectorDisplayContext } from "@/selectors/context"
import { convertUsdForDisplay, formatDisplayNumber } from "@/selectors/convert"
import type { EcisSelectorInput } from "@/selectors/input"
import type { SensitivitiesPageViewModel } from "@/selectors/types"
import { PAGE_VM_VERSION } from "@/selectors/types"

function fmtMoney(ctx: SelectorDisplayContext, usd: number | null): string {
  if (usd === null || !Number.isFinite(usd)) return "—"
  const d = convertUsdForDisplay(usd, ctx)
  return `${formatDisplayNumber(d.display, ctx)} ${ctx.currencyCode}`
}

export function selectSensitivitiesPageViewModel(
  input: EcisSelectorInput,
  ctx: SelectorDisplayContext,
): SensitivitiesPageViewModel {
  const { sensitivityMode, stressCase, monteCarloIterations } = input.controls
  const stressGridAvailable =
    sensitivityMode !== "off" && stressCase !== "none"

  const sr = input.sensitivityRun
  const staleVersusRecompute =
    sr.basedOnRecomputeRevision !== null &&
    sr.basedOnRecomputeRevision !== input.recomputeMeta.revision

  const tornado = sr.tornadoBars.map((b) => ({
    driverId: b.driverId,
    label: b.label,
    impactDisplay: fmtMoney(ctx, b.impactMagnitude),
    baseDisplay: fmtMoney(ctx, b.baseEquityNpv),
    lowDisplay: fmtMoney(ctx, b.lowEquityNpv),
    highDisplay: fmtMoney(ctx, b.highEquityNpv),
  }))

  const twoWay =
    sr.twoWay !== null && sr.twoWay.cells.length > 0
      ? {
          rowAxisLabel: sr.twoWay.rowParamLabel,
          colAxisLabel: sr.twoWay.colParamLabel,
          colHeaders: sr.twoWay.colLabels,
          rows: sr.twoWay.rowLabels.map((rowLabel, ri) => ({
            rowLabel,
            cells: (sr.twoWay!.cells[ri] ?? []).map((v) => fmtMoney(ctx, v)),
          })),
        }
      : null

  const breakeven = sr.breakevenLines.map((l) => ({
    label: l.label,
    statusLabel:
      l.status === "ok"
        ? "Found / computed"
        : l.status === "skipped"
          ? "Skipped"
          : "Not found",
    summary: l.summary,
  }))

  return {
    version: PAGE_VM_VERSION,
    sensitivityMode,
    stressCase,
    monteCarloIterations,
    stressGridAvailable,
    summary: [
      `mode=${sensitivityMode}`,
      `stress=${stressCase}`,
      `mc=${monteCarloIterations}`,
    ].join(" · "),
    runPhase: sr.phase,
    staleVersusRecompute,
    enginePathNote:
      "Sensitivity uses assumptionsToEngineInput → runEngine on cloned snapshots; dashboard results are unchanged until you Recompute.",
    tornado,
    twoWay,
    breakeven,
    warnings: sr.warnings,
  }
}
