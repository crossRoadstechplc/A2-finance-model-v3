import type { RunEngineFn } from "@/engine/types"
import {
  SENSITIVITY_DEFAULT_DSCR_COVENANT,
  SENSITIVITY_DEFAULT_TARGET_EQUITY_IRR,
  SENSITIVITY_DIESEL_BENCHMARK_USD_PER_KWH,
} from "@/sensitivity/constants"
import { cloneAssumptionsSnapshot } from "@/sensitivity/cloneSnapshot"
import type { SensitivityEngineMetrics } from "@/sensitivity/metrics"
import { runSensitivityCell } from "@/sensitivity/runCell"
import type { AssumptionsSnapshot } from "@/store/types"

export type BreakevenLine = {
  id: string
  label: string
  status: "ok" | "not_found" | "skipped"
  summary: string
}

function fleetSweep(
  baseSnap: AssumptionsSnapshot,
  test: (m: SensitivityEngineMetrics) => boolean,
  options?: { runEngineImpl?: RunEngineFn; onBudget?: () => boolean },
): { value: number | null; warning: string | null } {
  const step = 5
  const maxV = 250
  let lastWarn: string | null = null
  for (let v = 0; v <= maxV; v += step) {
    if (options?.onBudget && !options.onBudget()) {
      return { value: null, warning: "Breakeven fleet sweep: budget exhausted." }
    }
    const s = cloneAssumptionsSnapshot(baseSnap)
    s.fleet.vehicleCount = v
    const run = runSensitivityCell(s, options)
    if (run.warning) lastWarn = run.warning
    if (run.metrics && test(run.metrics)) {
      return { value: v, warning: lastWarn }
    }
  }
  return { value: null, warning: lastWarn }
}

export function runBreakevenAnalysis(
  baseSnap: AssumptionsSnapshot,
  options?: {
    runEngineImpl?: RunEngineFn
    onBudget?: () => boolean
    targetEquityIrr?: number
    dscrCovenant?: number
  },
): { lines: BreakevenLine[]; warnings: string[] } {
  const warnings: string[] = []
  const targetIrr =
    options?.targetEquityIrr ?? SENSITIVITY_DEFAULT_TARGET_EQUITY_IRR
  const dscrCov = options?.dscrCovenant ?? SENSITIVITY_DEFAULT_DSCR_COVENANT
  const lines: BreakevenLine[] = []

  const irr0 = fleetSweep(
    baseSnap,
    (m) => m.equityIrr !== null && m.equityIrr >= 0,
    options,
  )
  if (irr0.warning) warnings.push(irr0.warning)
  lines.push({
    id: "equity_irr_gte_0",
    label: "Equity IRR ≥ 0 (fleet vehicles)",
    status: irr0.value !== null ? "ok" : "not_found",
    summary:
      irr0.value !== null
        ? `From ~${irr0.value} vehicles (step 5 search on fleet count).`
        : "No crossing found in 0–250 vehicles (step 5).",
  })

  const irrT = fleetSweep(
    baseSnap,
    (m) => m.equityIrr !== null && m.equityIrr >= targetIrr,
    options,
  )
  if (irrT.warning) warnings.push(irrT.warning)
  lines.push({
    id: "equity_irr_gte_target",
    label: `Equity IRR ≥ target (${(targetIrr * 100).toFixed(0)}%)`,
    status: irrT.value !== null ? "ok" : "not_found",
    summary:
      irrT.value !== null
        ? `From ~${irrT.value} vehicles (step 5 search on fleet count).`
        : `No crossing found up to 250 vehicles for IRR ≥ ${(targetIrr * 100).toFixed(0)}%.`,
  })

  const npv0 = fleetSweep(
    baseSnap,
    (m) => m.equityNpv !== null && m.equityNpv >= 0,
    options,
  )
  if (npv0.warning) warnings.push(npv0.warning)
  lines.push({
    id: "equity_npv_gte_0",
    label: "Equity NPV ≥ 0",
    status: npv0.value !== null ? "ok" : "not_found",
    summary:
      npv0.value !== null
        ? `From ~${npv0.value} vehicles (step 5 search on fleet count).`
        : "No crossing found in 0–250 vehicles (step 5).",
  })

  const dscrOk = fleetSweep(
    baseSnap,
    (m) =>
      m.minDscr !== null && Number.isFinite(m.minDscr) && m.minDscr >= dscrCov,
    options,
  )
  if (dscrOk.warning) warnings.push(dscrOk.warning)
  lines.push({
    id: "dscr_gte_covenant",
    label: `Min DSCR ≥ covenant (${dscrCov.toFixed(2)}×)`,
    status: dscrOk.value !== null ? "ok" : "not_found",
    summary:
      dscrOk.value !== null
        ? `From ~${dscrOk.value} vehicles (step 5 search; higher fleet improves coverage in this path).`
        : `No fleet level in sweep met DSCR ≥ ${dscrCov.toFixed(2)}×.`,
  })

  // Diesel parity ≤ 1 for fleet-facing retail stack: retail / benchmark ≤ 1
  const sm = baseSnap.snapshotModel
  const a2e = sm?.a2EnergyUsdPerKwh ?? 0
  const a2p = sm?.a2PlatformUsdPerKwh ?? 0
  const bench = SENSITIVITY_DIESEL_BENCHMARK_USD_PER_KWH
  const maxGrid = bench - a2e - a2p
  if (maxGrid < 0) {
    lines.push({
      id: "diesel_parity_lte_1",
      label: "Diesel parity ≤ 1 (retail / benchmark)",
      status: "ok",
      summary: `A2 energy + platform (${(a2e + a2p).toFixed(4)} USD/kWh) already exceed benchmark (${bench} USD/kWh) — parity not reachable without lowering A2 components.`,
    })
  } else {
    if (options?.onBudget && !options.onBudget()) {
      warnings.push("Diesel parity line skipped (budget).")
      lines.push({
        id: "diesel_parity_lte_1",
        label: "Diesel parity ≤ 1 (retail / benchmark)",
        status: "skipped",
        summary: "Skipped (budget).",
      })
    } else {
      const s = cloneAssumptionsSnapshot(baseSnap)
      if (s.snapshotModel) s.snapshotModel.gridPassThroughUsdPerKwh = Math.max(0, maxGrid)
      const run = runSensitivityCell(s, options)
      if (run.warning) warnings.push(run.warning)
      const ratio = run.metrics?.dieselParityRatio
      const ratioStr =
        ratio !== null && ratio !== undefined && Number.isFinite(ratio)
          ? ratio.toFixed(3)
          : "—"
      lines.push({
        id: "diesel_parity_lte_1",
        label: "Diesel parity ≤ 1 (retail / benchmark)",
        status: "ok",
        summary: `Cap grid pass-through near ${maxGrid.toFixed(4)} USD/kWh (holding A2 energy & platform fixed) so total retail stays at benchmark; implied parity ratio ≈ ${ratioStr}.`,
      })
    }
  }

  return { lines, warnings }
}
