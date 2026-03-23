import { getDefaultPersistedSlice } from "@/store/persistence/partialize"
import type { EcisStore, PersistedEcisSlice } from "@/store/types"

function normalizeSystem(
  system: Partial<PersistedEcisSlice["system"]> | undefined,
): PersistedEcisSlice["system"] {
  const base = getDefaultPersistedSlice().system
  return {
    modelHorizonYears: system?.modelHorizonYears ?? base.modelHorizonYears,
    discountRatePercent: system?.discountRatePercent ?? base.discountRatePercent,
    inflationAssumptionPercent:
      system?.inflationAssumptionPercent ?? base.inflationAssumptionPercent,
    terminalGrowthRatePercent:
      system?.terminalGrowthRatePercent ?? base.terminalGrowthRatePercent,
    exitMultiple: system?.exitMultiple ?? base.exitMultiple,
    corridorWideDiscountRatePercent:
      system?.corridorWideDiscountRatePercent ?? base.corridorWideDiscountRatePercent,
    dscrMinimum: system?.dscrMinimum ?? base.dscrMinimum,
    dscrLockupThreshold: system?.dscrLockupThreshold ?? base.dscrLockupThreshold,
    dscrDistributionThreshold:
      system?.dscrDistributionThreshold ?? base.dscrDistributionThreshold,
    debtServiceReserveMonths:
      system?.debtServiceReserveMonths ?? base.debtServiceReserveMonths,
    maintenanceReservePercentCapex:
      system?.maintenanceReservePercentCapex ?? base.maintenanceReservePercentCapex,
    cashSweepTriggerDscr:
      system?.cashSweepTriggerDscr ?? base.cashSweepTriggerDscr,
    contingencyPercentCapex:
      system?.contingencyPercentCapex ?? base.contingencyPercentCapex,
    developmentCostPercentCapex:
      system?.developmentCostPercentCapex ?? base.developmentCostPercentCapex,
    notes: system?.notes ?? base.notes,
  }
}

/** Coerce any persisted partial to a full slice and drop legacy unknown fields. */
export function withPersistedDefaults(
  p: Partial<PersistedEcisSlice>,
): PersistedEcisSlice {
  const d = getDefaultPersistedSlice()
  return {
    settings: { ...d.settings, ...p.settings },
    system: normalizeSystem(p.system),
    platform: { ...d.platform, ...p.platform },
    energy: { ...d.energy, ...p.energy },
    fleet: {
      ...d.fleet,
      ...p.fleet,
      annualTruckPlan: (p.fleet?.annualTruckPlan?.length
        ? p.fleet.annualTruckPlan
        : d.fleet.annualTruckPlan
      ).map((row) => ({ ...row })),
    },
    controls: { ...d.controls, ...p.controls },
    snapshotModel: {
      ...d.snapshotModel,
      ...p.snapshotModel,
      infrastructureOverrides: {
        ...d.snapshotModel.infrastructureOverrides,
        ...p.snapshotModel?.infrastructureOverrides,
      },
    },
    scalingBands:
      p.scalingBands && p.scalingBands.length > 0
        ? p.scalingBands.map((r) => ({ ...r }))
        : d.scalingBands,
    workspace: {
      ...d.workspace,
      ...p.workspace,
      panels: {
        ...d.workspace.panels,
        ...p.workspace?.panels,
      },
    },
    scenarios: {
      named: { ...d.scenarios.named, ...p.scenarios?.named },
    },
  }
}

/**
 * Deep-repair persisted slices against defaults so new fields never read as undefined.
 */
export function mergePersistedEcisSlice(
  persisted: unknown,
  current: EcisStore,
): EcisStore {
  if (!persisted || typeof persisted !== "object") {
    return current
  }

  const p = persisted as Partial<PersistedEcisSlice>
  const repaired = withPersistedDefaults(p)

  return {
    ...current,
    settings: repaired.settings,
    system: repaired.system,
    platform: repaired.platform,
    energy: repaired.energy,
    fleet: repaired.fleet,
    controls: repaired.controls,
    snapshotModel: repaired.snapshotModel,
    scalingBands: repaired.scalingBands,
    workspace: {
      ...current.workspace,
      ...repaired.workspace,
      panels: {
        ...current.workspace.panels,
        ...repaired.workspace.panels,
      },
    },
    scenarios: {
      named: { ...current.scenarios.named, ...repaired.scenarios.named },
    },
  }
}
