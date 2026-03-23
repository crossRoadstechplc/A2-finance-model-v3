import type { RunEngineFn } from "@/engine/types"
import { cloneAssumptionsSnapshot } from "@/sensitivity/cloneSnapshot"
import { runSensitivityCell } from "@/sensitivity/runCell"
import type { AssumptionsSnapshot } from "@/store/types"

export type TwoWayGrid = {
  rowParamId: string
  rowParamLabel: string
  colParamId: string
  colParamLabel: string
  /** Column headers (low → high) */
  colLabels: readonly string[]
  /** Row headers (low → high) */
  rowLabels: readonly string[]
  /** row-major [r][c] equity NPV */
  cells: readonly (readonly (number | null)[])[]
  warnings: readonly string[]
}

function fiveIntSpread(center: number, lowFrac: number, highFrac: number): number[] {
  const lo = Math.max(0, Math.round(center * lowFrac))
  const hi = Math.max(lo, Math.round(center * highFrac))
  return [0, 1, 2, 3, 4].map((i) => Math.round(lo + ((hi - lo) * i) / 4))
}

export function buildTwoWaySensitivityGrid(
  baseSnap: AssumptionsSnapshot,
  options?: {
    runEngineImpl?: RunEngineFn
    onBudget?: () => boolean
  },
): TwoWayGrid {
  const warnings: string[] = []
  const baseVc = Math.max(0, baseSnap.fleet.vehicleCount)
  const baseDisc = baseSnap.system.discountRatePercent

  const rowValues = fiveIntSpread(Math.max(1, baseVc), 0.75, 1.25)
  const colValues = [0, 1, 2, 3, 4].map((i) => baseDisc + (i - 2))

  const rowLabels = rowValues.map((v) => String(v))
  const colLabels = colValues.map((d) => `${d}%`)

  const dim = 5
  const cells: (number | null)[][] = []

  for (let r = 0; r < dim; r++) {
    if (options?.onBudget && !options.onBudget()) {
      warnings.push("Two-way matrix: truncated (budget).")
      break
    }
    const row: (number | null)[] = []
    for (let c = 0; c < dim; c++) {
      if (options?.onBudget && !options.onBudget()) {
        warnings.push("Two-way matrix: truncated (budget).")
        break
      }
      const s = cloneAssumptionsSnapshot(baseSnap)
      s.fleet.vehicleCount = rowValues[r]!
      s.system.discountRatePercent = colValues[c]!
      const run = runSensitivityCell(s, options)
      if (run.warning) warnings.push(`Cell (${r},${c}): ${run.warning}`)
      row.push(run.metrics?.equityNpv ?? null)
    }
    if (row.length > 0) cells.push(row)
  }

  return {
    rowParamId: "fleet_vehicleCount",
    rowParamLabel: "Fleet — vehicle count",
    colParamId: "system_discountRatePercent",
    colParamLabel: "System — discount rate (%/yr)",
    colLabels,
    rowLabels,
    cells,
    warnings,
  }
}
