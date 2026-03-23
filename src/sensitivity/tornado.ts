import type { RunEngineFn } from "@/engine/types"
import { cloneAssumptionsSnapshot } from "@/sensitivity/cloneSnapshot"
import { runSensitivityCell } from "@/sensitivity/runCell"
import type { AssumptionsSnapshot } from "@/store/types"

export type TornadoDriver = {
  id: string
  label: string
  applyLow: (s: AssumptionsSnapshot) => void
  applyHigh: (s: AssumptionsSnapshot) => void
}

const P = 0.1

function driversFromSnapshot(base: AssumptionsSnapshot): TornadoDriver[] {
  const vc = base.fleet.vehicleCount
  const disc = base.system.discountRatePercent
  const grid = base.snapshotModel?.gridPassThroughUsdPerKwh ?? 0
  const peak = base.energy.peakDemandMw
  const util = base.fleet.utilizationPercent
  const ren = base.energy.renewableTargetPercent
  const a2e = base.snapshotModel?.a2EnergyUsdPerKwh ?? 0

  return [
    {
      id: "fleet_vehicleCount",
      label: "Fleet — vehicle count",
      applyLow: (s) => {
        s.fleet.vehicleCount = Math.max(0, Math.round(vc * (1 - P)))
      },
      applyHigh: (s) => {
        s.fleet.vehicleCount = Math.max(0, Math.round(vc * (1 + P)))
      },
    },
    {
      id: "system_discountRatePercent",
      label: "System — discount rate (%/yr)",
      applyLow: (s) => {
        s.system.discountRatePercent = Math.max(0, disc - 1)
      },
      applyHigh: (s) => {
        s.system.discountRatePercent = disc + 1
      },
    },
    {
      id: "snapshot_gridPassThrough",
      label: "Pricing — grid pass-through (USD/kWh)",
      applyLow: (s) => {
        if (s.snapshotModel)
          s.snapshotModel.gridPassThroughUsdPerKwh = Math.max(0, grid * (1 - P))
      },
      applyHigh: (s) => {
        if (s.snapshotModel)
          s.snapshotModel.gridPassThroughUsdPerKwh = Math.max(0, grid * (1 + P))
      },
    },
    {
      id: "energy_peakDemandMw",
      label: "Energy — peak demand (MW)",
      applyLow: (s) => {
        s.energy.peakDemandMw = Math.max(0, peak * (1 - P))
      },
      applyHigh: (s) => {
        s.energy.peakDemandMw = peak * (1 + P)
      },
    },
    {
      id: "fleet_utilizationPercent",
      label: "Fleet — utilization (%)",
      applyLow: (s) => {
        s.fleet.utilizationPercent = Math.max(0, util - 5)
      },
      applyHigh: (s) => {
        s.fleet.utilizationPercent = Math.min(100, util + 5)
      },
    },
    {
      id: "energy_renewableTargetPercent",
      label: "Energy — renewable target (%)",
      applyLow: (s) => {
        s.energy.renewableTargetPercent = Math.max(0, ren - 5)
      },
      applyHigh: (s) => {
        s.energy.renewableTargetPercent = Math.min(100, ren + 5)
      },
    },
    {
      id: "snapshot_a2EnergyUsdPerKwh",
      label: "Pricing — A2 energy (USD/kWh)",
      applyLow: (s) => {
        if (s.snapshotModel)
          s.snapshotModel.a2EnergyUsdPerKwh = Math.max(0, a2e * (1 - P))
      },
      applyHigh: (s) => {
        if (s.snapshotModel)
          s.snapshotModel.a2EnergyUsdPerKwh = Math.max(0, a2e * (1 + P))
      },
    },
  ]
}

export type TornadoBar = {
  driverId: string
  label: string
  baseEquityNpv: number | null
  lowEquityNpv: number | null
  highEquityNpv: number | null
  /** max(|low-base|, |high-base|) on equity NPV */
  impactMagnitude: number
  warnings: readonly string[]
}

export function runTornadoAnalysis(
  baseSnap: AssumptionsSnapshot,
  options?: {
    runEngineImpl?: RunEngineFn
    maxDrivers?: number
    onBudget?: () => boolean
  },
): { bars: TornadoBar[]; warnings: string[] } {
  const warnings: string[] = []
  const base = runSensitivityCell(baseSnap, options)
  if (base.warning) warnings.push(base.warning)
  const baseNpv = base.metrics?.equityNpv ?? null

  const drivers = driversFromSnapshot(baseSnap)
  const maxD = options?.maxDrivers ?? drivers.length
  const bars: TornadoBar[] = []

  for (let i = 0; i < Math.min(drivers.length, maxD); i++) {
    if (options?.onBudget && !options.onBudget()) {
      warnings.push("Tornado: stopped early (time/call budget).")
      break
    }
    const d = drivers[i]!

    const lowSnap = cloneAssumptionsSnapshot(baseSnap)
    d.applyLow(lowSnap)
    const lowRun = runSensitivityCell(lowSnap, options)
    if (lowRun.warning) warnings.push(`${d.label} (low): ${lowRun.warning}`)

    if (options?.onBudget && !options.onBudget()) {
      warnings.push("Tornado: stopped early (time/call budget).")
      break
    }

    const highSnap = cloneAssumptionsSnapshot(baseSnap)
    d.applyHigh(highSnap)
    const highRun = runSensitivityCell(highSnap, options)
    if (highRun.warning) warnings.push(`${d.label} (high): ${highRun.warning}`)

    const lo = lowRun.metrics?.equityNpv ?? null
    const hi = highRun.metrics?.equityNpv ?? null
    const i0 = baseNpv !== null && lo !== null ? Math.abs(lo - baseNpv) : 0
    const i1 = baseNpv !== null && hi !== null ? Math.abs(hi - baseNpv) : 0
    const impact = baseNpv === null ? 0 : Math.max(i0, i1)

    bars.push({
      driverId: d.id,
      label: d.label,
      baseEquityNpv: baseNpv,
      lowEquityNpv: lo,
      highEquityNpv: hi,
      impactMagnitude: impact,
      warnings: [lowRun.warning, highRun.warning].filter(
        (w): w is string => w !== null,
      ),
    })
  }

  bars.sort((a, b) => b.impactMagnitude - a.impactMagnitude)
  return { bars, warnings }
}
